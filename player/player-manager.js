(function () {
    const fs = require("fs");
    const serviceManager = require("../services/service-manager.js");
    const KodiController = require("../player/kodi.js");
    const OMXController = require("../player/omxplayer.js");
    const VLCController = require("../player/vlc.js");
    var players = [];
    var activePlayer = null;
    var playerMap = {};
    var PlayerManager = {
        registerPlayer: function (name, player) {
            players.push(player);
            playerMap[name] = player;
            player.key = name;
        },
        getPlayerByKey: function (name) {
            for (var index in players) {
                var p = players[index];
                if (p.key == name) return p;
            }
            return undefined;
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
    PlayerManager.registerPlayer("VLC", new VLCController());
    PlayerManager.registerPlayer("OMX", new OMXController());

    var file = (process.env.HOME || process.env.USERPROFILE) + "/chromecast.enabled";
    var useChromeCast = fs.existsSync(file);
    if (useChromeCast) {
        const ChromecastController = require("../player/chromecast.js");
        const LookupChromeCastController = require("../player/find-chromecast.js");
        var lccc = new LookupChromeCastController(function(castDevice) {
            var name = (castDevice.name || "");
            if (name.lastIndexOf("-") > 0) {
                name = name.substring(0, name.lastIndexOf("-"));
            }
            var player = PlayerManager.getPlayerByKey(name);
            if (player) {
                name = name + "_" + castDevice.address;
            }
            PlayerManager.registerPlayer(name, new ChromecastController(castDevice.address, castDevice.port));
        });
        lccc.lookup();
    }

    module.exports = PlayerManager;
})();
