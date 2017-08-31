(function () {
    const request = require("request");
    var YoutubeCom = {
        name: "youtube.com",
        find: function (options) {
            return new Promise(function (resolve, reject) {

                var keyword =  options.term || "";
                if (keyword == null || keyword.length == 0) {
                    reject(new Error("Empty search key"));
                    return;
                }
                var quality = options.quality || "";
                var genre = options.genre || "";
                var url = "https://www.googleapis.com/youtube/v3/search?q=" + keyword + "&part=snippet&key=AIzaSyA94gwn5hghSfnrqBuKEWnrM_UcEwnrowI"
                url += "&type=video";
                if (quality.length > 0) {
                    var k = (quality === "1080p" || quality === "720p") ? "high" : "any";
                    url = url + "&videoDefinition=" + k;
                }
                var limit = options.limit || 10;
                url += "&maxResults=" + limit;
                var pageToken = options.page || "";
                var orderBy = options.orderBy || "";
                if (orderBy.length > 0) {

                }
                url += "&limit=" + limit;

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
