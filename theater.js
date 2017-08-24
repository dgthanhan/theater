(function () {
    const webServer = require("./webserver.js");
    const KodiController = require("./player/kodi.js");

    function main() {
        var player = new KodiController(13000);
        
        webServer.setPlayer(player);
        webServer.start();
    }

    module.exports = main;
})();
