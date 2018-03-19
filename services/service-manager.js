(function () {
    const EventEmitter = require("events");

    var services = [];
    var serviceMap = {};

    var activeService = null;
    var currentContent = null;
    var resolvedURL = null;
    var playbackMessage = null;
    var playbackOK = true;
    var player = null;

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
    Manager.registerService(require("./sopcast/module.js"));
    Manager.registerService(require("./youtube/module.js"));

    Manager.getServices = function () {
        return services;
    };
    Manager.play = function (type, url, selectedUrl) {
        if (selectedUrl) {
            console.log("Force play url: " + selectedUrl);
        }
        return new Promise(function (resolve, reject) {
            playbackMessage = "Stopping player...";
            sayStatusChanged();

            player.stop().then(function() {
                for (var s of services) {
                    if (s.type != type) s.terminate();
                }
                var service = Manager.getService(type);
                console.log("Playing: ", url, service.type);

                var content = service.findCachedContent(url);
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

                if (selectedUrl) {
                    content.selectedUrl = selectedUrl;
                }
                service.start(content).then(function (resolvedContent) {

                    console.log("resolvedContent Before:", resolvedContent);

                    resolvedURL = resolvedContent.url;
                    playbackOK = true;
                    playbackMessage = "Sending media to player...";
                    sayStatusChanged();
                    console.log("resolvedContent", content);
                    player.play(resolvedContent.url, {live: resolvedContent.live, subtitlePath: resolvedContent.subtitlePath, id: url, content: resolvedContent}).then(function () {
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
            }).catch(function (e) {
                playbackOK = false;
                playbackMessage = "Failed to stop current playback: " + e;
                console.error(e);
                sayStatusChanged();
            });
        });
    };

    Manager.resendPlayback = function () {
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
        return new Promise(function (resolve, reject) {
            resolve();
            player.resume();
            sayStatusChanged();
        });
    };
    Manager.seekTo = function (seconds) {
        return new Promise(function (resolve, reject) {
            resolve();
            player.seekTo(seconds);
            sayStatusChanged();
        });
    };
    Manager.pause = function () {
        return new Promise(function (resolve, reject) {
            resolve();
            player.pause();
            sayStatusChanged();
        });
    };

    Manager.stop = function () {
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
        if (player && currentContent) {
            status.position = player.getCurrentPosition(currentContent.url);
        }
        return status;
    };
    Manager.setPlayer = function (providedPlayer) {
        player = providedPlayer;
    };
    Manager.notifyStatusChange = function () {
        sayStatusChanged();
    };

    module.exports = Manager;
})();
