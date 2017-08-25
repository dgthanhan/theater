(function () {
    const express = require("express");
    const path = require("path");
    const serviceManager = require("./services/service-manager.js");
    const addWSSupport = require("express-ws");

    var server = null;
    var wsServer = null;
    var player = null;
    var statusWSEnpoint = null;

    function start() {
        server = express();
        wsServer = addWSSupport(server);

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
            serviceManager.play(request.query.service, request.query.url).then(function () {
                response.json({message: "OK"})
            }).catch (function () {
                response.status(500).send(e);
            });
        });

        server.ws("/status", function(ws, request) {
            ws.on("message", function(msg) {
                if (msg === "get") ws.send(JSON.stringify(serviceManager.getCurrentStatus()));
            });
        });

        wsServer.getWss().on("connection", function (ws, request) {
            ws.send(JSON.stringify(serviceManager.getCurrentStatus()));
        });

        serviceManager.hub.on("status", function (status) {
            broadcast(status);
        })

        server.listen(12002);
        console.log("Web server started.");
    }

    function setPlayer(providedPlayer) {
        player = providedPlayer;
    }

    function broadcast(status) {
        if (!wsServer || !wsServer.getWss().clients) return;
        wsServer.getWss().clients.forEach(function (client) {
            if (client.readyState === 1) client.send(JSON.stringify(status));
        });
    }


    module.exports = {
        start: start,
        setPlayer: setPlayer
    };
})();
