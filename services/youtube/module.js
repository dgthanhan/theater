(function () {
    const {State} = require("../common.js");
    const BaseService = require("../base-service.js");

    function YoutubeService() {
        this.type = YoutubeService.TYPE;
        this.name = "Youtube";
        this.state = State.Idle;
        this.sources = [
            require("./source-youtube_com.js")
        ];
    }

    YoutubeService.TYPE = "youtube";
    YoutubeService.prototype = new BaseService();
    YoutubeService.prototype.start = function (content) {
        var thiz = this;
        return new Promise(function (resolve, reject) {

            thiz.state = State.Serving;

            resolve({
                url: content.isPlaylist ? "plugin://plugin.video.youtube/?path=/root/video&action=play_all&playlist=" + content.extras.id :
                 "plugin://plugin.video.youtube/?path=/root/video&action=play_video&videoid=" + content.extras.id,
                content: content
            });
        });
    };

    YoutubeService.prototype.findAvailableContents = function (options) {
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
                for (var c of contents) {

                    if (!c.type || c.type === "" || typeof(c.type) === "undefined") {
                        c.type = YoutubeService.TYPE;
                    }
                    thiz.cache[c.url] = c;
                }
                resolve(contents);
            }).catch(function (e) {
                reject(e);
            });
        });
    };
    YoutubeService.prototype.findCachedContent = function (url) {
        console.log("Finding: " + url + " in ", this.cache);
        return this.cache ? this.cache[url] : {
            title: url,
            contentType: "video",
            type: YoutubeService.TYPE,
            duration: null,
            description: "",
            thumbnails: [],
            url: url,
            extras: {}
        };
    };
    YoutubeService.prototype.getCurrentStatus = function () {
        return this.state;
    };
    YoutubeService.prototype.terminate = function () {
        this.state = State.Idle;
    };
    YoutubeService.prototype.getSearchFilterOptions = function() {
        return {
          searchable: true,
          allowBlankKeyword: true,
          genre:  [
                    {name: "All Types",    type: "any"},
                    {name: "Eposide", type: "eposide"},
                    {name: "Movie", type: "movie"}
                  ],
          sortBy: [
                    {name: "Relevance",   type: "relevance"},
                    {name: "Date Added",  type: "date"},
                    {name: "Title",       type: "title"},
                    {name: "Rating",      type: "rating"},
                    {name: "View Count",  type: "viewCount"}
                  ],
          quality: [
                    {name: "All Qualities",     type: "any"},
                    {name: "Standard",type: "standard"},
                    {name: "High",    type: "high"},
                  ]
        };
    }
    module.exports = new YoutubeService();
})();
