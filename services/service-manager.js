(function () {
    const EventEmitter = require("events");
    const playerManager = require("../player/player-manager.js");

    var services = [];
    var serviceMap = {};

    var activeService = null;
    var currentContent = null;
    var resolvedURL = null;
    var playbackMessage = null;
    var playbackOK = true;

    var Manager = {
        registerService: function (service) {
            services.push(service);
            serviceMap[service.type] = service;
        },
        getService: function (type) {
            return serviceMap[type];
        },
        hub: new EventEmitter()
    };

    Manager.registerService(require("./torrent/module.js"));
    Manager.registerService(require("./external/module.js"));
    Manager.registerService(require("./sopcast/module.js"));
    Manager.registerService(require("./youtube/module.js"));

    Manager.getServices = function () {
        return services;
    };

    Manager.play = function (config) {
        var options = config || {};
        //console.log("play options: ", options);
        if (typeof(options.expectedDownloaded) == "undefined") {
            options.expectedDownloaded = 10;
        }
        return new Promise(function (resolve, reject) {
            playbackMessage = "Stopping player...";
            sayStatusChanged();
            var player = playerManager.getPlayer();

            if (options.player != player.key) {
                console.log("Play on other player requested... " + options.player);
                if (playerManager) {
                    player = playerManager.activePlayer(options.player);
                    console.log("Switch to player " + player.key);
                }
            }

            var playFunc =function() {
                for (var s of services) {
                    if (s.type != options.type) s.terminate();
                }
                var service = Manager.getService(options.type);
                console.log("Playing: ", options.url, service.type);

                var content = service.findCachedContent(options.url);
                currentContent = content;
                activeService = service;

                console.log("Content to play: ", content);

                if (!content) {
                    reject(new Error("Content not found"));
                    return;
                } else {
                    resolve();
                }

                player.showNotification(content.title, "Theater is prearing channel. Sit back and relax please!");

                playbackOK = true;
                playbackMessage = "Resolving media..";
                sayStatusChanged();

                if (options.selectedUrl) {
                    content.selectedUrl = options.selectedUrl;
                }
                service.start({content: content, lang: options.lang, expectedDownloaded: options.expectedDownloaded}).then(function (resolvedContent) {
                    resolvedURL = resolvedContent.url;
                    playbackOK = true;
                    playbackMessage = "Sending media to player...";
                    sayStatusChanged();
                    var subPath = resolvedContent.subtitlePath;

                    player.play(resolvedContent.url, {live: resolvedContent.live, subtitlePath: subPath, id: options.url, content: resolvedContent}).then(function () {
                        playbackMessage = "Media sent to player";
                        sayStatusChanged();
                    }).catch(function (e) {
                        playbackOK = false;
                        playbackMessage = "Failed to play on player: " + e;
                        console.error(e);
                        sayStatusChanged();
                    });
                }).catch(function (e) {
                    playbackOK = false;
                    playbackMessage = "Unable to resolve media to playable stream using backend: " + e;
                    console.error(e);
                    sayStatusChanged();
                });
            };

            player.stop().then(function() {
                playFunc();
            }).catch(function (e) {
                playbackOK = false;
                playbackMessage = "Failed to stop current playback: " + e;
                console.error(e);
                sayStatusChanged();
            });
        });
    };
    Manager.resendPlayback = function () {
        var player = playerManager.getPlayer();
        return new Promise(function (resolve, reject) {
            if (!resolvedURL) {
                reject(new Error("No URL"));
                return;
            }
            resolve();

            playbackMessage = "Sending media to player...";
            sayStatusChanged();
            player.play(resolvedURL, {live: currentContent && currentContent.live}).then(function () {
                playbackMessage = "Media sent to player";
                sayStatusChanged();
            }).catch(function (e) {
                playbackOK = false;
                playbackMessage = "Failed to play on player: " + e;
                console.error(e);
                sayStatusChanged();
            });
        });
    };
    Manager.resume = function () {
        var player = playerManager.getPlayer();
        return new Promise(function (resolve, reject) {
            resolve();
            player.resume();
            sayStatusChanged();
        });
    };
    Manager.reboot = function () {
        var player = playerManager.getPlayer();
        return new Promise(function (resolve, reject) {
            resolve();
            player.reboot();
            sayStatusChanged();
        });
    };
    Manager.seekTo = function (seconds) {
        var player = playerManager.getPlayer();
        return new Promise(function (resolve, reject) {
            playbackMessage = "Seeking...";
            player.seekTo(seconds).then(function(result) {
                playbackMessage = "Done...";
                resolve();
                sayStatusChanged();
            }).catch(reject);
        });
    };
    Manager.pause = function () {
        var player = playerManager.getPlayer();
        return new Promise(function (resolve, reject) {
            resolve();
            player.pause();
            sayStatusChanged();
        });
    };

    Manager.stop = function () {
        var player = playerManager.getPlayer();
        return new Promise(function (resolve, reject) {
            resolve();
            player.stop();
            if (activeService) activeService.terminate();
            currentContent = null;
            resolvedURL = null;

            sayStatusChanged();
        });
    };

    function sayStatusChanged() {
        try {
            setTimeout(function () {
                Manager.hub.emit("status", Manager.getCurrentStatus());
            }, 10);
        } catch (e) {
            console.error(e);
        }
    };

    Manager.getCurrentStatus = function () {
        var status = {};
        if (currentContent) status.content = currentContent;
        if (activeService) {
            status.service = {
                type: activeService.type,
                name: activeService.name,
                status: activeService.getCurrentStatus(),
                backend: activeService.getBackendStatus(),
            };
        }

        status.playbackStatus = playbackOK ? "OK" : "Error";
        status.playbackMessage = playbackMessage;
        var player = playerManager.getPlayer();
        if (player && currentContent) {
            status.position = player.getCurrentPosition(currentContent.url);
        }
        return status;
    };

    Manager.notifyStatusChange = function () {
        sayStatusChanged();
    };
    module.exports = Manager;
})();
