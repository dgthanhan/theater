(function () {
    const {State} = require("../common.js");

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
                        var largestFile = torrent.files.reduce(function (a, b) {
                            return a.length > b.length ? a : b;
                        });

                        movieFileName = largestFile.name;

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
                                langs: ["en"],
                                format: "srt"
                            }).then(function (subtitles){
                                if (subtitles && subtitles.length > 0) {
                                    options.content.subtitlePath = subtitles[0].path;
                                    console.log("Found subtitle: " + subtitles[0].path);
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

    TorrentConverter.prototype.getFullStatus = function () {
        return {
            status: this.status,
            message: this.message,
            url: this.url,

        }
    };

    module.exports = TorrentConverter;
})();
