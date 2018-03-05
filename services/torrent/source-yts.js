(function () {
    const request = require("request");
    var YTS = {
        name: "yts",
        find: function (options) {
            return new Promise(function (resolve, reject) {
                var keyword =  options.term || "";
                if (keyword == null || keyword.length == 0) {
                    keyword = "";
                }
                var genre = options.genre || "";
                var quality = options.quality || "";
                var sortBy = options.sortBy || "";
                var page = options.page || 1;
                var limit = options.limit || 10;
                var url = "https://yts.ag/api/v2/list_movies.json?sort_by=year&query_term=" + keyword;
                if (genre.length > 0) {
                    url = url + "&genre=" + genre;
                }
                if (quality.length > 0) {
                    url = url + "&quality=" + quality;
                }
                if (sortBy.length > 0) {
                    url = url +  "&sort_by=" + sortBy;
                }
                var orderBy = options.orderBy || "desc";
                url += "&order_by=" + orderBy;
                url += "&page=" + page;
                url += "&limit=" + limit;

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

                    var data = JSON.parse(body);
                    var movies = data.data.movies;

                    var contents = [];
                    if (movies != null && movies.length > 0) {
                        for (var movie of movies) {
                            if (!movie.torrents || movie.torrents.length == 0) continue;
                            var content = {
                                title: movie.title,
                                imdb: movie.imdb_code,
                                contentType: "video",
                                duration: movie.runtime * 60,
                                description: movie.summary,
                                thumbnails: [movie.medium_cover_image],
                                url: movie.torrents[0].url,
                                hash: movie.torrents[0].hash,
                                year: movie.year,
                                rating: movie.rating,
                                extras: {
                                    torrents: movie.torrents
                                }
                            };
                            contents.push(content);
                        }
                    }
                    var vc = data.data.movie_count;
                    var hasMore = vc > 0 && (data.data.page_number * data.data.limit) < vc;
                    console.log("Has more items " + hasMore + " video counts: " + vc);
                    if (hasMore) {
                        //Item to load more
                        contents.push({title: "Load more...", description: "", page: data.data.page_number + 1, limit: data.data.limit});
                    }
                    resolve(contents);
                });
            });
        }
    };

    module.exports = YTS;
})();
