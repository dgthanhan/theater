(function () {
    const webServer = require("./webserver.js");
    const KodiController = require("./player/kodi.js");
    const serviceManager = require("./services/service-manager.js");

    function main() {
        var player = new KodiController(13000);

        serviceManager.setPlayer(player);

        webServer.setPlayer(player);
        webServer.start();
        player.showNotification("Theater", "Theater application started and is ready now. Enjoy your P2P channels!");
    }

    module.exports = main;
})();
