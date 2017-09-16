(function () {
    const {spawn, exec} = require("child_process");

    function OMXController() {
    }

    OMXController.prototype.play = function (url, options) {
        var thiz = this;
        return new Promise(function (resolve, reject) {
            thiz.stop().then(function () {
                var cmd = "omxplayer -o hdmi --blank ";
                if (options && options.live) cmd += "--live ";
                cmd += url;
                cmd += " > ~/omxplayer.log";

                exec(cmd, function (error, stdout, stderr) {
                });
                resolve();
            });
        });
    };
    OMXController.prototype.stop = function () {
        var thiz = this;
        return new Promise(function (resolve, reject) {
            exec("killall omxplayer.bin", function (error, stdout, stderr) {
                resolve();
            });
        });
    };
    OMXController.prototype.showNotification = function (title, message) {
        return new Promise(function (resolve, reject) {
            resolve();
            // exec("notify-send", function (error, stdout, stderr) {
            //     resolve();
            // });
        });
    };


    module.exports = OMXController;
})();


//http://127.0.0.1:12001/jsonrpc?request={"jsonrpc":"2.0","id":"1","method":"Player.Open","params":{"item":{"file":"http://clips.vorwaerts-gmbh.de/VfE_html5.mp4"}}}
