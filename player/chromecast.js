(function () {
    var Client                = require('castv2-client').Client;
    var DefaultMediaReceiver  = require('castv2-client').DefaultMediaReceiver;
    var mdns                  = require('mdns');

    const Common = require("../services/common.js");

    function ChromecastController() {
        this.status = "";
        this.trackCurrentPosition();
        this.lanIP = Common.findLANAddress();
    }

    ChromecastController.prototype.saveStatus = function (status) {
        console.log('status broadcast playerState', JSON.stringify(status));

        try {
            this.status = status.playerState || "";
            var t = Math.round(status.currentTime);
            var l = status.media ? Math.round(status.media.duration) : (this.timeCache ? this.timeCache.lengthInSeconds : 0);
            var cache = {
                time: Common.kodiTimeFromSeconds(t),
                length: Common.kodiTimeFromSeconds(l),
                timeInSeconds: t,
                lengthInSeconds: l,
                remaining: Common.kodiTimeFromSeconds(l-t)
            };

            this.timeCache = cache;
        } catch (e) {
            console.error(e);
        }
    };

    ChromecastController.prototype.playOn = function (address, url, options) {
        var thiz = this;
        return new Promise(function (resolve, reject) {
            thiz.client = new Client();

            thiz.client.on('error', reject);

            thiz.client.connect(address, function() {
                thiz.client.launch(DefaultMediaReceiver, function(err, player) {
                    if (err) {
                        reject(err);
                        return;
                    }

                    var srtUrl = "http://" + thiz.lanIP + ":12002/theater-current.vtt?t=" + (new Date().getTime());
                    console.log("Sub URL", srtUrl);

                    var media = {
                        contentId: url.replace(/127.0.0.1/, thiz.lanIP),
                        contentType: 'video/mp4',
                        streamType: 'BUFFERED', // or LIVE

                        tracks: [{
                            trackId: 1, // This is an unique ID, used to reference the track
                            type: 'TEXT', // Default Media Receiver currently only supports TEXT
                            trackContentId: srtUrl, // the URL of the VTT (enabled CORS and the correct ContentType are required)
                            trackContentType: 'text/vtt', // Currently only VTT is supported
                            name: 'Vietnamese', // a Name for humans
                            language: 'vi-VN', // the language
                            subtype: 'SUBTITLES' // should be SUBTITLES
                        }],

                        textTrackStyle: {
                            backgroundColor: '#00000000', // see http://dev.w3.org/csswg/css-color/#hex-notation
                            foregroundColor: '#FFFFFFFF', // see http://dev.w3.org/csswg/css-color/#hex-notation
                            edgeType: 'DROP_SHADOW', // can be: "NONE", "OUTLINE", "DROP_SHADOW", "RAISED", "DEPRESSED"
                            edgeColor: '#00000099', // see http://dev.w3.org/csswg/css-color/#hex-notation
                            fontScale: 1.3, // transforms into "font-size: " + (fontScale*100) +"%"
                            fontStyle: 'NORMAL', // can be: "NORMAL", "BOLD", "BOLD_ITALIC", "ITALIC",
                            fontFamily: 'Droid Sans', // specific font family
                            fontGenericFamily: 'SANS_SERIF', // can be: "SANS_SERIF", "MONOSPACED_SANS_SERIF", "SERIF", "MONOSPACED_SERIF", "CASUAL", "CURSIVE", "SMALL_CAPITALS",
                            windowColor: '#00000000', // see http://dev.w3.org/csswg/css-color/#hex-notation
                            windowRoundedCornerRadius: 10, // radius in px
                            windowType: 'ROUNDED_CORNERS' // can be: "NONE", "NORMAL", "ROUNDED_CORNERS"
                        },
                    };

                    player.on('status', function(status) {
                        if (status) thiz.saveStatus(status);
                    });

                    console.log('app "%s" launched, loading media %s ...', player.session.displayName, media.contentId);

                    player.load(media, { autoplay: true }, function(err, status) {
                        console.log('media loaded playerState=%s', status ? status.playerState : "");

                        if (err) {
                            reject(err);
                            return;
                        }

                        player.media.sessionRequest({
                            type: 'EDIT_TRACKS_INFO',
                            activeTrackIds: [1] // switch to subtitle with trackId 2
                        });

                        resolve();
                        //
                        // // Seek to 2 minutes after 15 seconds playing.
                        // setTimeout(function() {
                        //     player.seek(2*60, function(err, status) {
                        //         //
                        //     });
                        // }, 15000);

                    });

                    thiz.player = player;
                });
            });

        });
    };

    ChromecastController.prototype.play = function (url, options) {
        var thiz = this;
        this.args = {
            url: url,
            options: options
        };

        return new Promise(function (resolve, reject) {
            thiz.stop().then(function () {
                var sequence = [
                    mdns.rst.DNSServiceResolve(),
                    mdns.rst.getaddrinfo({families: [4] })
                ];
                var browser = mdns.createBrowser(mdns.tcp('googlecast'), {resolverSequence: sequence});
                browser.on('serviceUp', function(service) {
                    console.log('found device "%s" at %s:%d', service.name, service.addresses[0], service.port);
                    thiz.playOn(service.addresses[0], url, options).then(resolve).catch(reject);
                    browser.stop();
                });

                browser.start();
            });
        });
    };
    ChromecastController.prototype.stop = function () {
        var thiz = this;
        this.stopRequested = true;

        try {
            if (!this.player) {
                return Promise.resolve();
            } else {
                return new Promise(function (resolve, reject) {
                    try {
                        thiz.player.stop(function () {});
                    } catch (e) {
                        console.error(e);
                    } finally {
                        resolve();
                    }
                });
            }
        } catch (e) {
            this.player = null;
        }
    };
    ChromecastController.prototype.pause = function () {
        var thiz = this;
        if (!this.player) return Promise.resolve();

        return new Promise(function (resolve, reject) {
            thiz.player.getStatus(function (status) {
                setTimeout(function () {
                    if (thiz.status == "PLAYING" || thiz.status == "BUFFERING") {
                        thiz.player.pause(resolve);
                    } else {
                        thiz.player.play(resolve);
                    }
                }, 500);
            });
        });
    };
    ChromecastController.prototype.seekTo = function (seconds) {
        var thiz = this;
        if (!this.player) return Promise.resolve();

        return new Promise(function (resolve, reject) {
            thiz.player.seek(seconds, resolve);
        });
    };
    ChromecastController.prototype.resume = function () {
        return this.pause();
    };

    ChromecastController.prototype.showNotification = function (title, message) {
        return new Promise(function (resolve, reject) {
            resolve();
            // exec("notify-send", function (error, stdout, stderr) {
            //     resolve();
            // });
        });
    };

    ChromecastController.POSITION_TRACK_INTERVAL = 1000;
    ChromecastController.prototype.trackCurrentPosition = function () {
        var thiz = this;

        if (!this.player) {
            setTimeout(function () {
                thiz.trackCurrentPosition();
            }, ChromecastController.POSITION_TRACK_INTERVAL);

            return;
        }
        this.player.getStatus(function (err, status) {
            if (status) thiz.saveStatus(status);

            setTimeout(function () {
                thiz.trackCurrentPosition();
            }, ChromecastController.POSITION_TRACK_INTERVAL);
        })
    };

    ChromecastController.prototype.setupCEC = function () {
    };
    ChromecastController.prototype.getCurrentPosition = function (id) {
        return this.timeCache;
    };

    module.exports = ChromecastController;
})();


//http://127.0.0.1:12001/jsonrpc?request={"jsonrpc":"2.0","id":"1","method":"Player.Open","params":{"item":{"file":"http://clips.vorwaerts-gmbh.de/VfE_html5.mp4"}}}
