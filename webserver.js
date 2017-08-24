(function () {
    const express = require("express");
    const path = require("path");
    const serviceManager = require("./services/service-manager.js");

    var server = null;
    var player = null;

    function start() {
        server = express();
        server.use("/static", express.static(path.join(__dirname, "ui/static")));

        server.get("/api/services", function (request, response) {
            var services = serviceManager.getServices();
            var items = [];
            for (var service of services) {
                items.push({
                    type: service.type,
                    name: service.name
                })
            }
            response.json(items);
        });

        server.get("/api/contents", function (request, response) {
            var service = serviceManager.getService(request.query.service);
            service.findAvailableContents().then(function (contents) {
                response.json(contents);
            }).catch(function (e) {
                response.status(500).send(e);
            });
        });

        server.get("/api/play", function (request, response) {
            var service = serviceManager.getService(request.query.service);
            var url = request.query.url;

            console.log("Playing: ", url, service.type);

            var content = service.findCachedContent(url);
            if (!content) {
                response.status(500).send({message: "Content not found"});
                return;
            }

            service.start(content).then(function (resolvedContent) {
                console.log("Resolved URL", resolvedContent.url);
                player.stop().then(function() {
                    player.play(resolvedContent.url);
                }).catch(function (e) {
                    console.error(e);
                    response.status(500).send(e);
                });
                response.json({message: "OK"})
            }).catch(function (e) {
                response.status(500).send(e);
            });
        });

        server.listen(12002);
        console.log("Web server started.");
    }

    function setPlayer(providedPlayer) {
        player = providedPlayer;
    }



    module.exports = {
        start: start,
        setPlayer: setPlayer
    };
})();
