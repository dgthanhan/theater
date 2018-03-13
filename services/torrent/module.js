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

    TorrentService.prototype.fetchPlaybackInfo = function(options) {
        var content = this.cache[options.url];
        if (!content) return {id: 0};
        content.playableLinks = content.extras.torrents;
        return content;
    }

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
    TorrentService.prototype.createConverter = function (content) {
        return new TorrentConverter();
    };
    TorrentService.prototype.getSearchFilterOptions = function() {
        return {
          searchable: true,
          allowBlankKeyword: true,
          genre: [
                    {name: "All Genres", type: ""},
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
                    {name: "All Qualities", type: ""},
                    {name: "HD 720p",     type: "720p"},
                    {name: "HD 1080p",    type: "1080p"},
                    {name: "3D",          type: "3D"}
                  ]
        };
    }
    module.exports = new TorrentService();
})();
