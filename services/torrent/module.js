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

    TorrentService.prototype.findAvailableContents = function (options) {
        var promises = [];
        var contents = [];
        for (var source of this.sources) {
            var promise = source.find(options).then(function(items) {
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

    TorrentService.prototype.start = function (content) {
        var thiz = this;

        return new Promise(function (resolve, reject) {
            if (thiz.converter) {
                try {
                    thiz.converter.destroy();
                } catch (e) {}
            } else {
                thiz.converter = new TorrentConverter();
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
    TorrentService.prototype.terminate = function () {
        if (this.converter) {
            try {
                this.converter.destroy();
            } catch (e) {}
        }
    };

    TorrentService.prototype.findCachedContent = function (url) {
        return this.cache ? this.cache[url] : {
            title: url,
            contentType: "video",
            type: TorrentService.TYPE,
            duration: null,
            description: "",
            thumbnails: [],
            url: url,
            extras: {}
        };
    };

    TorrentService.prototype.getCurrentStatus = function () {
        return this.converter ? this.converter.status : State.Idle;
    };
    TorrentService.prototype.getSearchFilterOptions = function() {
        return {
          searchable: true,
          genre: [
                    {name: "All Genre", type: ""},
                    {name: "Action",    type: "Action"},
                    {name: "Animation", type: "Animation"},
                    {name: "Advanture", type: "Advanture"},
                    {name: "Biography", type: "Biography"},
                    {name: "Comedy",    type: "Comedy"},
                    {name: "Crime",     type: "Crime"},
                    {name: "Documentary", type: "Documentary"},
                    {name: "Drama",     type: "Drama"},
                    {name: "Family",    type: "Family"},
                    {name: "Fantasy",   type: "Fantasy"},
                    {name: "Film-Noir", type: "Film-Noir"},
                    {name: "History",   type: "History"},
                    {name: "Horror",    type: "Horror"},
                    {name: "Music",     type: "Music"},
                    {name: "Musical",   type: "Musical"},
                    {name: "Mystery",   type: "Mystery"},
                    {name: "Romance",   type: "Romance"},
                    {name: "Sci-Fi",    type: "Sci-Fi"},
                    {name: "Sport",     type: "Sport"},
                    {name: "Thriller",  type: "Thriller"},
                    {name: "War",       type: "War"},
                    {name: "Western",   type: "Western"}
                  ],
          sortBy: [
                    {name: "Date Added",  type: "date_added"},
                    {name: "Title",       type: "title"},
                    {name: "Year",        type: "year"},
                    {name: "Rating",      type: "rating"}
                  ],
          quality: [
                    {name: "All Quality", type: ""},
                    {name: "HD 720p",     type: "720p"},
                    {name: "HD 1080p",    type: "1080p"},
                    {name: "3D",          type: "3D"}
                  ]
        };
    }
    module.exports = new TorrentService();
})();
