(function () {
    const webServer = require("./webserver.js");
    const KodiController = require("./player/kodi.js");
    const VLCController = require("./player/vlc.js");
    const OMXController = require("./player/omxplayer.js");
    const serviceManager = require("./services/service-manager.js");
    const discovery = require("./discovery.js");


    function main() {
        discovery.start();

        var player = new KodiController(13000);

        serviceManager.setPlayer(player);

        webServer.setPlayer(player);
        webServer.start();
        setTimeout(function () {
            player.showNotification("Theater", "Theater application: " + webServer.lanIP);
        }, 2000);
    }

/*

    const diff = require("diff");

    var imdb = "tt0451279";
    var movieFile = "Wonder.Woman.2017.3D.HSBS.BluRay.x264-[YTS.AG].mp4";

    var subs = [];

    const subSearch = require("yifysubtitles");
    subSearch(imdb, {
        path: "/tmp",
        langs: ["en"],
        format: "srt"
    }).then(function (subtitles){
        if (subtitles && subtitles.length > 0) {
            const ignoredRE = /[^a-z0-9]+/gi;
            const extRE = /\.[a-z0-9]+$/gi;
            var a = movieFile.replace(extRE, "").replace(ignoredRE, " ").toUpperCase();
            for (var sub of subtitles) {
                var b = sub.fileName.replace(extRE, "").replace(ignoredRE, " ").toUpperCase();
                var d = diff.diffWords(a, b);
                var delta = 0;
                for (var e of d) if (e.added || e.removed) delta += e.count;
                subs.push({
                    fileName: sub.fileName,
                    diff: delta
                });
            }

            subs.sort(function (a, b) { return a.diff - b.diff; })
            for (var sub of subs) {
                console.log("* " + sub.fileName + ": " + sub.diff);
            }
        }
    }).catch(function (e) {
        console.log("Failed to search for subtitles.");
        console.error(e);
    });

    */


    module.exports = main;
})();
