(function () {

    const {State} = require("../common.js");
    const BaseService = require("../base-service.js");

    const {spawn} = require("child_process");
    const TorrentConverter = require("./torrent-converter.js");

    function TorrentService() {
        this.type = TorrentService.TYPE;
        this.name = "Torrent";
        this.converter = null;
        this.sources = [
            require("./source-popcorn.js"),
            require("./source-yts.js")
        ];
    }

    TorrentService.TYPE = "torrent";

    TorrentService.prototype = new BaseService();

    TorrentService.prototype.fetchPlaybackInfo = function(options) {
        var content =  this.cache ? this.cache[options.url] : undefined;
        if (!content) return {id: 0};
        content.playableLinks = content.extras.torrents;
        return content;
    }

    TorrentService.prototype.findAvailableContents = function (options) {
        var promises = [];
        var contents = [];
        var lookupIn = null;
        var sourceName = options.source || "yts";
        for (var source of this.sources) {
            if (sourceName == source.name) {
                lookupIn = source;
                break;
            }
        }

        if (!lookupIn) {
            resolve([]);
            return;
        }
        var promise = lookupIn.find(options).then(function(items) {
            contents = contents.concat(items);
        });
        promises.push(promise);

        var thiz = this;

        return new Promise(function (resolve, reject) {
            Promise.all(promises).then(function () {

                thiz.cache = {};

                for (var content of contents) {
                    content.type = TorrentService.TYPE;
                    thiz.cache[content.url] = content;
                }

                resolve(contents);
            }).catch(function (e) {
                reject(e);
            });
        });
    };
    TorrentService.prototype.createConverter = function (content) {
        return new TorrentConverter();
    };

    module.exports = new TorrentService();
})();
