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

    Manager.registerService(require("./sopcast/module.js"));
    // Manager.registerService(require("torrent/module.js"));
    // Manager.registerService(require("youtube/module.js"));
    Manager.getServices = function () {
        return services;
    };
    Manager.play = function (type, url) {
        return new Promise(function (resolve, reject) {
            var service = Manager.getService(type);
            console.log("Playing: ", url, service.type);

            var content = service.findCachedContent(url);
            currentContent = content;
            activeService = service;

            if (!content) {
                reject(new Error("Content not found"));
                return;
            } else {
                resolve();
            }

            playbackOK = true;
            playbackMessage = "Resolving media..";
            sayStatusChanged();

            service.start(content).then(function (resolvedContent) {
                resolvedURL = resolvedContent.url;
                playbackMessage = "Stopping player...";
                sayStatusChanged();
                player.stop().then(function() {
                    playbackMessage = "Sending message to player...";
                    sayStatusChanged();
                    player.play(resolvedContent.url).then(function () {
                        playbackMessage = "Media sent to player";
                        sayStatusChanged();
                    }).catch(function (e) {
                        playbackOK = false;
                        playbackMessage = "Failed to play on player: " + e;
                        sayStatusChanged();
                    });
                }).catch(function (e) {
                    playbackOK = false;
                    playbackMessage = "Failed to stop current playback: " + e;
                    sayStatusChanged();
                });
            }).catch(function (e) {
                playbackOK = false;
                playbackMessage = "Unable to resolve media to playable stream using backend: " + e;
                sayStatusChanged();
            });
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
                status: activeService.getCurrentStatus()
            };
        }

        status.playbackStatus = playbackOK ? "OK" : "Error";
        status.playbackMessage = playbackMessage;

        return status;
    };
    Manager.setPlayer = function (providedPlayer) {
        player = providedPlayer;
    };

    module.exports = Manager;
})();
