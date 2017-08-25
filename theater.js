(function () {
    const webServer = require("./webserver.js");
    const KodiController = require("./player/kodi.js");
    const serviceManager = require("./services/service-manager.js");

    function main() {
        var player = new KodiController(13000);

        serviceManager.setPlayer(player);

        webServer.setPlayer(player);
        webServer.start();
    }

    module.exports = main;
})();
