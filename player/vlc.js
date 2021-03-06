(function () {
    const {spawn, exec} = require("child_process");

    function VLCController() {
    }

    VLCController.prototype.play = function (url) {
        var thiz = this;
        return new Promise(function (resolve, reject) {
            thiz.stop().then(function () {
                exec("vlc " + url.replace(/\/[^\/]*$/, "/") + " --fullscreen", function (error, stdout, stderr) {
                    resolve();
                });
            });
        });
    };
    VLCController.prototype.stop = function () {
        var thiz = this;
        return new Promise(function (resolve, reject) {
            exec("killall -9 vlc", function (error, stdout, stderr) {
                resolve();
            });
        });
    };
    VLCController.prototype.showNotification = function (title, message) {
        return new Promise(function (resolve, reject) {
            resolve();
            // exec("notify-send", function (error, stdout, stderr) {
            //     resolve();
            // });
        });
    };

    VLCController.prototype.getCurrentPosition = function(url) {
        return {};
    }
    VLCController.prototype.pause = function() {

    }
    VLCController.prototype.resume = function() {

    }
    VLCController.prototype.reboot  = function() {

    }
    VLCController.prototype.seekTo = function(seconds) {

    }
    module.exports = VLCController;
})();


//http://127.0.0.1:12001/jsonrpc?request={"jsonrpc":"2.0","id":"1","method":"Player.Open","params":{"item":{"file":"http://clips.vorwaerts-gmbh.de/VfE_html5.mp4"}}}
