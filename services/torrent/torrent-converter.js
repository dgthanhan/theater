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
        const peerflix = require("peerflix");
        const readTorrent = require("read-torrent");

        this.status = State.Preparing;

        return new Promise(function (resolve, reject) {
            readTorrent(url, function (error, torrent) {
                if (error) {
                    reject(error);
                } else {
                    var flix = null;
                    try {
                        flix = peerflix(torrent, {});
                    } catch (e) {
                        reject(e);
                        return;
                    }

                    console.log("Got flix", flix);

                    flix.server.once('listening', function () {
                        thiz.status = State.Serving;
                        console.log("engine.server.address()", flix.server.address());
                        var url = 'http://' + flix.server.address().address + ":" + flix.server.address().port + '/';
                        console.log("Flix listening: " + url);
                        resolve(url);
                        console.log("Resolve called");
                    });
                    flix.server.on('error', function (error) {
                        console.error(error);
                        reject(error);
                    });
                }
            });
        });
    };

    SopcastConverter.prototype.destroy = function () {
    };

    module.exports = SopcastConverter;
})();
