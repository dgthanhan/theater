(function () {
    const {State} = require("../common.js");
    const playerManager = require("../../player/player-manager.js");

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
        var player = playerManager.getPlayer();
        var subFormat = player.getSubtitlesFormat ? player.getSubtitlesFormat() : "srt";

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
                        console.log("Expected download: " + options.expectedDownloaded + "%");
                        //try searching subtitle

                        var resolveFunc = function(url) {
                            if (options.expectedDownloaded > 0) {
                                var fetchSatus = function() {
                                    var status = thiz.getFullStatus();
                                    var downloaded = Math.round(status.swarmStats.downloaded * 100 / status.swarmStats.totalLength);
                                    if (downloaded >= options.expectedDownloaded) {
                                        if (thiz.waitingTask) clearTimeout(thiz.waitingTask);
                                        thiz.waitingTask = null;
                                        if (thiz.flix) {
                                            console.log("Ready to play...", url);
                                            resolve(url);
                                        }
                                    } else {
                                        if (thiz.flix) {
                                            thiz.waitingTask = setTimeout(fetchSatus, 5000);
                                        }
                                    }
                                }
                                fetchSatus();
                            } else {
                                resolve(url);
                                console.log("Resolve called");
                            }
                        }

                        if (options && options.content && options.content.imdb) {
                            const subSearch = require("yifysubtitles");
                            options.content.subtitlePath = null;

                            function trySubtitles(lang, callback) {
                                subSearch(options.content.imdb, {
                                    path: "/tmp",
                                    langs: [lang],
                                    format: subFormat
                                }).then(function (subtitles) {
                                    console.log("subtitles", subtitles);
                                    if (subtitles && subtitles.length > 0 && subtitles[0].path) {
                                        var sub = subtitles[0];
                                        console.log("Used sub -->", sub);
                                        options.content.subtitlePath = sub.path;

                                        try {
                                            fs.createReadStream(options.content.subtitlePath).pipe(fs.createWriteStream("/tmp/theater-current." + subFormat));
                                        } catch (e) {
                                            console.error(e);
                                        }

                                        callback();
                                    } else {
                                        if (lang != "en") {
                                            trySubtitles("en", callback);
                                        } else {
                                            console.log("No subtitle found.");
                                            callback();
                                        }
                                    }
                                }).catch(function (e) {
                                    console.log("Failed to search for subtitles.");
                                    console.error(e);
                                    callback();
                                });
                            }

                            trySubtitles(options.lang, function () {
                                resolveFunc(url);
                            });

                        } else {
                            resolveFunc(url);
                        }
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
            } catch (e) {
                console.error(e);
            }
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
