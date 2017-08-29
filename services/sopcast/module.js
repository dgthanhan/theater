(function () {

    const {State} = require("../common.js");
    const BaseService = require("../base-service.js");
    const {spawn} = require("child_process");
    const SopcastConverter = require("./sopcast-converter.js");

    function SopcastService() {
        this.type = SopcastService.TYPE;
        this.name = "Sopcast";
        this.converter = null;
        this.sources = [
            require("./source-sopsport_org.js")
        ];
    }

    SopcastService.TYPE = "sopcast";

    SopcastService.prototype = new BaseService();

    SopcastService.prototype.findAvailableContents = function (options) {
        var promises = [];
        var contents = [];
        for (var source of this.sources) {
            var promise = source.find().then(function(items) {
                contents = contents.concat(items);
            });
            promises.push(promise);
        }

        var thiz = this;

        return new Promise(function (resolve, reject) {
            Promise.all(promises).then(function () {
                if (contents.length == 0) {
                    contents.push({
                        title: "CBNS TV",
                        contentType: "video",
                        duration: null,
                        description: "CBNS TV Free streaming Classic and new Sci-Fi movies all day",
                        thumbnails: ["https://pbs.twimg.com/profile_images/670291739207458816/E8EMpfY1.jpg"],
                        url: "sop://178.239.62.116:3912/140335",
                        extras: {}
                    });
                }

                thiz.cache = {};

                for (var content of contents) {
                    content.type = SopcastService.TYPE;
                    thiz.cache[content.url] = content;
                }

                resolve(contents);
            }).catch(function (e) {
                reject(e);
            });
        });
    };

    SopcastService.prototype.start = function (content) {
        var thiz = this;

        return new Promise(function (resolve, reject) {
            if (thiz.converter) {
                try {
                    thiz.converter.destroy();
                } catch (e) {}
            } else {
                thiz.converter = new SopcastConverter();
            }

            thiz.converter.convert(content.url).then(function (url) {
                resolve({
                    url: url,
                    content: content
                })
            }).catch(function (e) {
                reject(e);
            });
        });
    };
    SopcastService.prototype.terminate = function () {
        if (this.converter) {
            try {
                this.converter.destroy();
            } catch (e) {}
        }
    };

    SopcastService.prototype.findCachedContent = function (url) {
        return this.cache ? this.cache[url] : {
            title: url,
            contentType: "video",
            type: SopcastService.TYPE,
            duration: null,
            description: "",
            thumbnails: [],
            url: url,
            extras: {}
        };
    };

    SopcastService.prototype.getCurrentStatus = function () {
        return this.converter ? this.converter.status : State.Idle;
    };

    module.exports = new SopcastService();
})();
