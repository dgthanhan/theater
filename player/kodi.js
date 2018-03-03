(function () {
    const request = require("request");

    function KodiController(port, options) {
        this.port = port;
        this.positionCache = {};
        this.trackCurrentPosition();
    }

    KodiController.prototype.getBaseURL = function () {
        return "http://127.0.0.1:" + this.port + "/jsonrpc?request=";
    };
    KodiController.prototype._get = function (object) {
        var thiz = this;
        return new Promise(function (resolve, reject) {
            var url = thiz.getBaseURL() + encodeURIComponent(JSON.stringify(object));
            request(url, function (error, response, body) {
                if (!response || response.statusCode != 200) {
                    reject(new Error("Invalid Kodi response"));
                    return;
                }

                var object = JSON.parse(body);
                console.log("KODI RESPONSE", object);
                resolve(object);
            });
        });
    };
    KodiController.prototype.play = function (url, options) {
        this.currentContentId = options ? options.id : null;

        console.log("LAST TRACKED TIME: ", this.positionCache[this.currentContentId]);

        return this._get({
            jsonrpc: "2.0",
            id: "1",
            method: "Player.Open",
            params: {
                item: {
                    file: url
                }
            }
        });
    };
    KodiController.prototype.stop = function () {
        var thiz = this;
        return new Promise(function (resolve, reject) {
            thiz._get({
                jsonrpc: "2.0",
                id: "1",
                method: "Player.GetActivePlayers"
            }).then(function (response) {
                var players = response.result;
                var pending = [];
                for (var player of players) {
                    pending.push(thiz._get({
                        jsonrpc: "2.0",
                        id: "1",
                        method: "Player.Stop",
                        params: {
                            playerid: player.playerid
                        }
                    }));
                }
                if (pending.length > 0) {
                    Promise.all(pending).then(function () {
                        setTimeout(resolve, 2000);
                    }).catch(reject);
                } else {
                    thiz.currentContentId = null;
                    resolve();
                }
            }).catch(reject);
        });
    };
    KodiController.prototype.showNotification = function (title, message) {
        return this._get({
            jsonrpc: "2.0",
            id: "1",
            method: "GUI.ShowNotification",
            params: {
                title: title || "Theater",
                message: message
            }
        });
    };
    KodiController.POSITION_TRACK_INTERVAL = 1000;

    KodiController.prototype.trackCurrentPosition = function () {
        var thiz = this;
        if (!thiz.currentContentId) {
            setTimeout(function () {
                thiz.trackCurrentPosition();
            }, KodiController.POSITION_TRACK_INTERVAL);

            return;
        }
        thiz._get({
            jsonrpc: "2.0",
            id: "1",
            method: "Player.GetActivePlayers"
        }).then(function (response) {
            var players = response.result;
            var player = null;
            if (players.length > 0) {
                thiz._get({
                    jsonrpc: "2.0",
                    id: "1",
                    method: "Player.GetProperties",
                    params: {
                        playerid: players[0].playerid,
                        properties: [
                            "position",
                            "time",
                            "totaltime"
                        ]
                    }
                }).then(function (response) {
                    console.log(response);
                    if (response && response.result && response.result.time) {
                        thiz.positionCache[thiz.currentContentId] = response.result;
                    }

                    setTimeout(function () {
                        thiz.trackCurrentPosition();
                    }, KodiController.POSITION_TRACK_INTERVAL);
                });
            } else {
                setTimeout(function () {
                    thiz.trackCurrentPosition();
                }, KodiController.POSITION_TRACK_INTERVAL);
            }
        })
    };



    module.exports = KodiController;
})();


//http://127.0.0.1:12001/jsonrpc?request={"jsonrpc":"2.0","id":"1","method":"Player.Open","params":{"item":{"file":"http://clips.vorwaerts-gmbh.de/VfE_html5.mp4"}}}
