(function () {
    const {State} = require("../common.js");
    const {spawn, exec} = require("child_process");

    function SopcastConverter() {
        this.status = State.Idle;
    }

    const INTERFACE = "127.0.0.1";
    const LOCAL_PORT = 12000;
    const PLAYER_PORT = 12001;

    function waitForPort(port, maxWait, disappearing) {
        return new Promise(function (resolve, reject) {
            var count = maxWait || 10;
            var checker = function () {
                count --;
                if (count < 0) {
                    reject(new Error("Timed out when waiting for port " + port));
                    return;
                }

                exec("netstat -anp | grep tcp | grep LISTEN | grep " + port, function (error, stdout, stderr) {
                    var satisfied = stdout && stdout.indexOf(":" + port) >= 0;
                    if (disappearing) satisfied = !satisfied;

                    if (satisfied) {
                        resolve();
                    } else {
                        setTimeout(checker, 1000);
                    }
                });
            }
            checker();
        });
    }

    function killAllBackends() {
        return new Promise(function (resolve, reject) {
            exec("ps aux | grep sp-sc-auth", function (error, stdout, stderr) {
                var ids = [];
                if (stdout) {
                    var lines = stdout.split(/[\r\n]+/);
                    for (var line of lines) {
                        if (line.match(/^[^ \t]+[ \t]+([0-9]+).*/) && line.indexOf("grep") < 0) {
                            var pid = RegExp.$1;
                            console.log("FOUND: " + pid + " > " + line);
                            ids.push(pid);
                        }
                    }
                }

                var index = -1;
                var next = function () {
                    index ++;
                    if (index >= ids.length) {
                        resolve();
                        return;
                    }

                    console.log("KILL " + ids[index]);
                    exec("kill -9 " + ids[index], next);
                };

                next();
            });
        });
    }

    SopcastConverter.prototype.convert = function (urls, options) {
        if (!options) options = {};
        var thiz = this;
        return new Promise(function (resolve, reject) {
            //TODO: sort urls by preference, try preferred URLs first
            var index = -1;
            var next = function () {
                index ++;
                if (index >= urls.length) {
                    //all were tried without success, reporting an error now
                    reject(new Error("Failed after trying all URLs."));
                    return;
                }

                var url = urls[index];
                console.log("Converting URL: " + url);
                thiz._convertURL(url, options).then(function (streamURL) {
                    resolve(streamURL);
                }).catch(function (e) {
                    console.error(e);
                    next();
                });
            };

            next();
        });
    };

    SopcastConverter.prototype._convertURL = function (url, options) {
        var thiz = this;
        return new Promise(function(resolve, reject) {
            var maxTries = (typeof(options.maxTries) === "number") ? options.maxTries : 5;
            var count = -1;
            var next = function () {
                count ++;
                console.log("count >= maxTries", count, maxTries);
                if (count >= maxTries) {
                    reject(new Error("Failed after " + maxTries + " tries."));
                    return;
                }

                console.log("  >> Attempt #" + count + "...");

                thiz._convertURLOnce(url, options).then(function (streamURL) {
                    console.log("      >> SUCCEEDED!");
                    resolve(streamURL);
                }).catch(function (e) {
                    console.log("      >> FAILED!");
                    next();
                });
            };

            next();
        });
    };

    SopcastConverter.prototype._convertURLOnce = function (url, options) {
        var thiz = this;

        if (this.workerProcess) {
            try {
                this.workerProcess.removeAllListeners();
                this.workerProcess.kill("SIGKILL");
            } catch (e) {}
        }

        return new Promise(function (resolve, reject) {
            thiz.status = State.Preparing;

            killAllBackends().then(function () {
                var arm = (process.arch === "arm");
                var cmd = arm ? "/home/pi/apps/sopcast/sop.sh" : "/usr/bin/sp-sc-auth";

                thiz.workerProcess = spawn(cmd, [url, LOCAL_PORT, PLAYER_PORT], {stdio: "ignore"});
                thiz.workerProcess.on("exit", function () {
                    thiz.status = State.Idle;
                    thiz.workerProcess = null;
                    console.log("sp-sc-auth exited.");
                });

                console.log("      Waiting for port to appear...");
                waitForPort(PLAYER_PORT, 20).then(function () {
                    console.log("      Port appeared, waiting for port to disappear...");
                    waitForPort(PLAYER_PORT, 15, "disappearing").then(function () {
                        //well, that's weird the port disappeared, reject it now
                        console.log("      Port disappeared, report as failure.");
                        reject(new Error("Port disappeared after started."));
                    }).catch(function () {
                        //ok, port looked good, it lasted for more than 10 seconds
                        console.log("      Port NOT disappeared, report as success.");
                        setTimeout(function () {
                            var streamURL = "http://" + INTERFACE + ":" + PLAYER_PORT + "/tv.asf?token=" + (new Date().getTime());
                            thiz.status = State.Serving;
                            resolve(streamURL);
                        }, 1000);
                    });
                }).catch(function (e) {
                    try {
                        thiz.workerProcess.removeAllListeners();
                        thiz.workerProcess.kill("SIGKILL");
                    } catch (e) {}
                    thiz.status = State.Idle;
                    reject(new Error("Failed to wait for sopcast." + e));
                });
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
