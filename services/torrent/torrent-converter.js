(function () {
    const {State} = require("../common.js");

    function SopcastConverter() {
        this.status = State.Idle;
    }

    function killAllBackends() {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    }

    SopcastConverter.prototype.convert = function (url, options) {
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
                        var url = 'http://' + thiz.flix.server.address().address + ":" + thiz.flix.server.address().port + '/' + (movieFileName ? movieFileName : "");
                        console.log("Flix listening: " + url);
                        resolve(url);
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

    SopcastConverter.prototype.destroy = function () {
        if (!this.flix) {
            try {
                this.flix.server.close(function () {});
                this.flix.destroy(function () {});
                this.flix = null;
            } catch (e) { }
        }
    };

    module.exports = SopcastConverter;
})();
