(function () {
    const {spawn, exec} = require("child_process");
    const {NodeCec, CEC} = require( "node-cec" );
    var Omx = require("node-omxplayer");

    function OMXController() {
        this.stopRequest = true;
        this.setupCEC();
        this.omx = null;
    }

    OMXController.prototype.play = function (url, options) {
        var thiz = this;
        this.args = {
            url: url,
            options: options
        };

        return new Promise(function (resolve, reject) {
            thiz.stop().then(function () {
                thiz.stopRequested = false;
                thiz.omx = new Omx(url, "hdmi")
                resolve();
                thiz.omx.on("close", function () {
                    console.log("OMXPlayer exit, stopRequested = " + thiz.stopRequested);
                    if (!thiz.stopRequested) {
                        console.log("  > Restart playback automatically...");
                        thiz.play(thiz.args.url, thiz.args.opions);
                    }
                });
            });
        });
    };
    OMXController.prototype.stop = function () {
        this.stopRequested = true;
        if (this.omx) {
            try {
                this.omx.removeAllListeners();
            } catch (e) {
                console.error(e);
            }

            this.omx.quit();
        }
        resolve();
    };
    OMXController.prototype.showNotification = function (title, message) {
        return new Promise(function (resolve, reject) {
            resolve();
            // exec("notify-send", function (error, stdout, stderr) {
            //     resolve();
            // });
        });
    };

    OMXController.prototype.setupCEC = function () {
        this.cec = new NodeCec("node-cec-monitor");
        process.on("SIGINT", function() {
            if (this.cec != null) {
                this.cec.stop();
            }
            process.exit(0);
        });

        this.cec.on("VENDOR_REMOTE_BUTTON_UP", function (packet) {
            if (!packet || !packet.args || !packet.args[0]) return;
            console.log(packet);
            var code = packet.args[0];
            if (code == CEC.UserControlCode.PLAY) {
                console.log("CEC: PLAY");
            } else if (code == CEC.UserControlCode.PAUSE) {
                console.log("CEC: PAUSE");
            } else if (code == CEC.UserControlCode.STOP) {
                console.log("CEC: STOP");
            } else if (code == CEC.UserControlCode.FAST_FORWARD) {
                console.log("CEC: FAST_FORWARD");
            } else if (code == CEC.UserControlCode.REWIND) {
                console.log("CEC: REWIND");
            }
        });

        this.cec.start("cec-client");
        console.log("CEC started.");
    };


    module.exports = OMXController;
})();


//http://127.0.0.1:12001/jsonrpc?request={"jsonrpc":"2.0","id":"1","method":"Player.Open","params":{"item":{"file":"http://clips.vorwaerts-gmbh.de/VfE_html5.mp4"}}}
