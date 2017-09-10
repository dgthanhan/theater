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
            require("./source-yts.js")
        ];
    }

    TorrentService.TYPE = "torrent";

    TorrentService.prototype = new BaseService();

    TorrentService.prototype.findAvailableContents = function () {
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
