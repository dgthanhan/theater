(function () {
    const {State} = require("../common.js");
    const {spawn, exec} = require("child_process");

    function SopcastConverter() {
        this.status = State.Idle;
    }

    const INTERFACE = "127.0.0.1";
    const LOCAL_PORT = 12000;
    const PLAYER_PORT = 12001;

    function waitForPort(port, maxWait) {
        return new Promise(function (resolve, reject) {
            var count = maxWait || 10;
            var checker = function () {
                count --;
                if (count < 0) {
                    reject(new Error("Timed out when waiting for port " + port));
                    return;
                }

                exec("netstat -anp | grep tcp | grep LISTEN | grep " + port, function (error, stdout, stderr) {
                    if (!error && stdout && stdout.indexOf(":" + port) >= 0) {
                        resolve();
                    } else {
                        setTimeout(checker, 1000);
                    }
                });
            }
            checker();
        });
    }

    SopcastConverter.prototype.convert = function (url, options) {
        var thiz = this;

        if (this.workerProcess) {
            try {
                this.workerProcess.removeAllListeners();
                this.workerProcess.kill("SIGKILL");
            } catch (e) {}
        }

        return new Promise(function (resolve, reject) {
            thiz.status = State.Preparing;

            var arm = (process.arch === "arm");
            var cmd = arm ? "/home/pi/apps/sopcast/sop.sh" : "/usr/bin/sp-sc-auth";

            thiz.workerProcess = spawn(cmd, [url, LOCAL_PORT, PLAYER_PORT], {stdio: "ignore"});
            thiz.workerProcess.on("exit", function () {
                thiz.status = State.Idle;
                thiz.workerProcess = null;
                console.log("sp-sc-auth exited.");
            });

            waitForPort(PLAYER_PORT, 10).then(function () {
                setTimeout(function () {
                    var streamURL = "http://" + INTERFACE + ":" + PLAYER_PORT + "/tv.asf";
                    thiz.status = State.Serving;
                    resolve(streamURL);
                }, 1000);
            }).catch(function (e) {
                try {
                    thiz.workerProcess.removeAllListeners();
                    thiz.workerProcess.kill("SIGKILL");
                } catch (e) {}
                thiz.status = State.Idle;
                reject(new Error("Failed to wait for sopcast." + e));
            });
        });
    };

    SopcastConverter.prototype.destroy = function () {
        if (this.workerProcess) {
            try {
                this.workerProcess.removeAllListeners();
                this.workerProcess.kill("SIGKILL");
            } catch (e) {}
        }
    };

    module.exports = SopcastConverter;
})();
