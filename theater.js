(function () {
    const webServer = require("./webserver.js");
    const playerManager = require("./player/player-manager.js");
    const discovery = require("./discovery.js");
    const ChromecastController = require("./player/chromecast.js");
    const LookupChromeCastController = require("./player/find-chromecast.js");


    function main() {
        discovery.start();

        var lccc = new LookupChromeCastController(function(castDevice) {
            playerManager.registerPlayer("CAST-" + castDevice.address,  new ChromecastController(castDevice.address, castDevice.castDevice));
        });
        lccc.lookup();

        var player = playerManager.activePlayer("KODI");
        webServer.start();

        setTimeout(function () {
            player.showNotification("Theater", "Theater application: " + webServer.lanIP);
        }, 5000);
    }
    module.exports = main;
})();
