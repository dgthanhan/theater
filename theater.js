(function () {
    const webServer = require("./webserver.js");
    const playerManager = require("./player/player-manager.js");
    const discovery = require("./discovery.js");
    function main() {
        discovery.start();
        var player = playerManager.activePlayer("CAST");
        webServer.start();
        setTimeout(function () {
            player.showNotification("Theater", "Theater application: " + webServer.lanIP);
        }, 5000);
    }
    module.exports = main;
})();
