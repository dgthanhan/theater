(function () {

    const {State} = require("../common.js");
    const {spawn} = require("child_process");

    function SopcastService() {
        this.type = SopcastService.TYPE;
        this.name = "Sopcast";
        this.status = State.Idle;
        this.workerProcess = null;
        this.sources = [
            require("./source-sopsport_org.js")
        ];
    }

    SopcastService.TYPE = "sopcast";

    SopcastService.prototype.findAvailableContents = function () {
        var promises = [];
        var contents = [];
        for (var source of this.sources) {
            console.log("Source: " + source.name);
            var promise = source.find().then(function(items) {
                contents = contents.concat(items);
            });
            promises.push(promise);
        }

        return new Promise(function (resolve, reject) {
            Promise.all(promises).then(function () {
                resolve(contents);
            }).catch(function (e) {
                reject(e);
            });
        });
    };

    SopcastService.prototype.start = function (content) {
        var thiz = this;

        if (this.workerProcess) {
            try {
                this.workerProcess.removeAllListeners();
                this.workerProcess.kill("SIGKILL");
            } catch (e) {}
        }

        this.status = State.Preparing;

        this.workerProcess = spawn("/usr/bin/sp-sc-auth", [content.url, "3908", "8908"], {stdio: "inherit", shell: true});
        this.workerProcess.on("exit", function () {
            console.log("workerProcess exited");
            thiz.status = State.Idle;
            thiz.workerProcess = null;
        });

        this.workerProcess.stdout.on("data", function (data) {
            console.log("SOP: ", data.toString());
        });

        // this.workerProcess.stdout.pipe(process.stdout);
    };
    SopcastService.prototype.terminate = function () {
    };

    SopcastService.prototype.getCurrentStatus = function () {
        //IDLE, PREPARING, SERVING
    };

    module.exports = new SopcastService();
})();
