(function () {
    const {State} = require("../common.js");
    const fs = require("fs");

    function TorrentConverter() {
        this.status = State.Idle;
        this.message = "";
        this.url = null;
    }

    function killAllBackends() {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    }

    TorrentConverter.prototype.convert = function (url, options) {
        var thiz = this;
        const peerflix = require("./flix2.js");
        const readTorrent = require("read-torrent");

        this.status = State.Preparing;

        return new Promise(function (resolve, reject) {
            readTorrent(url, function (error, torrent) {
                if (error) {
                    reject(error);
                } else {
                    var movieFileName = "";
                    thiz.flix = null;
                    try {
                        var largestFile = torrent.files ? torrent.files.reduce(function (a, b) {
                            return a.length > b.length ? a : b;
                        }) : null;
                        movieFileName = largestFile ? largestFile.name : "";

                        thiz.flix = peerflix(torrent, {fileName: movieFileName});
                    } catch (e) {
                        reject(e);
                        return;
                    }

                    thiz.flix.server.once('listening', function () {
                        thiz.status = State.Serving;
                        var url = 'http://127.0.0.1:' + thiz.flix.server.address().port + '/' + (movieFileName ? movieFileName : "");
                        console.log("Flix listening: " + url);

                        //try searching subtitle
                        if (options && options.content && options.content.imdb) {
                            const subSearch = require("yifysubtitles");
                            options.content.subtitlePath = null;

                            subSearch(options.content.imdb, {
                                path: "/tmp",
                                langs: options.lang ? [options.lang] : ["en", "vi"],
                                format: "srt"
                            }).then(function (subtitles){
                                if (subtitles && subtitles.length > 0) {
                                    options.content.subtitlePath = subtitles[0].path;
                                    fs.createReadStream(options.content.subtitlePath).pipe(fs.createWriteStream("/tmp/theater-current.srt"));
                                }
                                resolve(url);
                            }).catch(function (e) {
                                console.log("Failed to search for subtitles.");
                                console.error(e);
                                resolve(url);
                            });

                        } else {
                            resolve(url);
                        }
                        console.log("Resolve called");
                    });
                    thiz.flix.server.on('error', function (error) {
                        console.error(error);
                        reject(error);
                    });
                }
            });
        });
    };

    TorrentConverter.prototype.destroy = function () {
        if (!this.flix) {
            try {
                this.flix.server.close(function () {});
                this.flix.destroy(function () {});
                this.flix = null;
            } catch (e) { }
        }
    };

    function readableSpeed(speed) {
        var k = Math.round(speed / 1024);
        if (k > 1024) return (Math.round(k * 10 / 1024) / 10) + " MB/s";
        return (Math.round(k * 10) / 10) + " KB/s";
    }

    TorrentConverter.prototype.getFullStatus = function () {
        var swarmStats = null;
        var backendSummary = "";

        if (this.flix && this.flix.swarm) {
            var totalPeers = this.flix.swarm.wires

            var activePeers = totalPeers.filter(function (wire) {
                return !wire.peerChoking
            })

            var totalLength = this.flix.files.reduce(function (prevFileLength, currFile) {
                return prevFileLength + currFile.length
            }, 0)

            swarmStats = {
                totalLength: totalLength,
                downloaded: this.flix.swarm.downloaded,
                uploaded: this.flix.swarm.uploaded,
                downloadSpeed: parseInt(this.flix.swarm.downloadSpeed(), 10),
                uploadSpeed: parseInt(this.flix.swarm.uploadSpeed(), 10),
                totalPeers: totalPeers.length,
                activePeers: activePeers.length,
                files: this.flix.files
            };

            backendSummary = "Peers: " + activePeers.length + "/" + totalPeers.length
                + ", Down: " + readableSpeed(swarmStats.downloadSpeed)
                + ", Up: " + readableSpeed(swarmStats.uploadSpeed)
                + ", " + (Math.round(swarmStats.downloaded * 100 / swarmStats.totalLength)) + "%";
        }

        return {
            status: this.status,
            message: this.message,
            url: this.url,
            backendSummary: backendSummary,
            swarmStats: swarmStats
        }
    };

    module.exports = TorrentConverter;
})();
