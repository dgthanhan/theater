(function () {
    const request = require("request");
    var YoutubeCom = {
        name: "youtube.com",
        getSearchFilterOptions: function() {
            return {
              searchable: true,
              allowBlankKeyword: true,
              genre:  [
                        {name: "All Types",    type: "any"},
                        {name: "Eposide", type: "eposide"},
                        {name: "Movie", type: "movie"}
                      ],
              sortBy: [
                        {name: "Relevance",   type: "relevance", defaultSort: "desc"},
                        {name: "Date Added",  type: "date", defaultSort: "desc"},
                        {name: "Title",       type: "title", defaultSort: "asc"},
                        {name: "Rating",      type: "rating", defaultSort: "desc"},
                        {name: "View Count",  type: "viewCount", defaultSort: "desc"}
                      ],
              quality: [
                        {name: "All Qualities",     type: "any"},
                        {name: "Standard",type: "standard"},
                        {name: "High",    type: "high"},
                      ]
            };
        },
        find: function (options) {
            return new Promise(function (resolve, reject) {

                var keyword =  options.term || "";

                var url = "https://www.googleapis.com/youtube/v3/search?q=" + encodeURIComponent(keyword) + "&part=snippet&key=AIzaSyA94gwn5hghSfnrqBuKEWnrM_UcEwnrowI"

                var genre = options.genre || "";
                if (genre.length > 0 ) {
                    url += "&type=" + genre;
                }

                var quality = options.quality || "";

                if (quality.length > 0 && genre === "video") {
                    url += "&videoDefinition=" + quality
                }

                var limit = options.limit || 10;
                url += "&maxResults=" + limit;

                var sortBy = options.sortBy || "";
                if (sortBy.length > 0) {
                    url += "&order=" + sortBy;
                }

                var pageToken = options.page || "";
                if (pageToken.length > 0) {
                    url += "&pageToken=" + pageToken;
                }

                console.log("Requesting " + url);
                request(url, function (error, response, body) {
                    if (error) {
                        reject(error);
                        return;
                    }

                    if (!response || response.statusCode != 200 || !body) {
                        reject(new Error("Invalid response"));
                        return;
                    }

                    var result = JSON.parse(body);
                    var items = result.items;

                    var contents = [];
                    if (items != null && items.length > 0) {
                        for (var media of items) {
                            var isVideo = media.id.kind === "youtube#video";
                            var content = {
                                title: media.snippet.title,
                                contentType: "video",
                                duration: null,
                                description: media.snippet.description,
                                thumbnails: [media.snippet.thumbnails.high.url],
                                url:  media.id.videoId,
                                isPlaylist: !isVideo,
                                extras: {id: isVideo ? media.id.videoId : media.id.playlistId}
                            };
                            contents.push(content);
                        }
                    }
                    var hasMore = result.nextPageToken && result.nextPageToken.length > 0 && result.pageInfo.totalResults > 0;
                    if (hasMore) {
                        contents.push({title: "Load more...", description: "", page: result.nextPageToken, limit: result.pageInfo.resultsPerPage});
                    }
                    resolve(contents);

                });
            });
        }
    };


    module.exports = YoutubeCom;
})();
