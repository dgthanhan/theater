(function () {

    const serviceManager = require("../services/service-manager.js");
    const KodiController = require("../player/kodi.js");
    const OMXController = require("../player/omxplayer.js");
    const VLCController = require("../player/vlc.js");
    const ChromecastController = require("../player/chromecast.js");

    var players = [];
    var activePlayer = null;
    var playerMap = {};
    var PlayerManager = {
        registerPlayer: function (name, player) {
            players.push(player);
            playerMap[name] = player;
            player.key = name;
        },
        getActivePlayerId: function() {
            return activePlayer ? activePlayer.key : "";
        },
        getPlayer: function() {
            return activePlayer;
        },
        activePlayer: function (name) {
            if (activePlayer && activePlayer.stop && activePlayer.key == name) {
                activePlayer.stop();
            }
            var player = playerMap[name];
            activePlayer = player;

            return player;
        },
    };

    PlayerManager.getAllPlayers = function () {
        var items = [];
        for (var c of players) {
            items.push({name: c.key, description: ""});
        }
        return items;
    };

    PlayerManager.registerPlayer("KODI", new KodiController(13000));
    PlayerManager.registerPlayer("CAST", new ChromecastController());
    PlayerManager.registerPlayer("VLC", new VLCController());
    PlayerManager.registerPlayer("OMX", new OMXController());

    module.exports = PlayerManager;
})();
