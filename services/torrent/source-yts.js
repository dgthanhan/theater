(function () {
    const request = require("request");
    var YTS = {
        name: "yts",
        getSearchFilterOptions: function() {
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
                        {name: "Date Added",  type: "date_added", defaultSort: "desc"},
                        {name: "Title",       type: "title", defaultSort: "asc"},
                        {name: "Year",        type: "year", defaultSort: "desc"},
                        {name: "Rating",      type: "rating", defaultSort: "desc"}
                      ],
              quality: [
                        {name: "All Qualities", type: ""},
                        {name: "HD 720p",     type: "720p"},
                        {name: "HD 1080p",    type: "1080p"},
                        {name: "3D",          type: "3D"}
                    ]
            };
        },
        find: function (options) {
            return new Promise(function (resolve, reject) {
                var keyword =  options.term || "";
                if (keyword == null || keyword.length == 0) {
                    keyword = "";
                }
                var genre = options.genre || "action";
                var quality = options.quality || "";
                var sortBy = options.sortBy || "year";
                var page = options.page || 1;
                var limit = options.limit || 10;
                var url = "https://yts.ag/api/v2/list_movies.json?&query_term=" + encodeURIComponent(keyword);
                if (genre.length > 0) {
                    url = url + "&genre=" + genre;
                }
                if (quality.length > 0) {
                    url = url + "&quality=" + quality;
                }
                if (sortBy.length > 0) {
                    url = url +  "&sort_by=" + sortBy;
                }
                var order = options.order || "desc";
                url += "&order_by=" + order;
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
                            var torrent = null;
                            for (var t of movie.torrents) {
                                console.log("Source", t);
                                if (t.quality == "1080p") {
                                    torrent = t;
                                    break;
                                }
                            }
                            if (!torrent) {
                                for (var t of movie.torrents) {
                                    if (t.quality == "720p") {
                                        torrent = t;
                                        break;
                                    }
                                }
                            }

                            if (!torrent) torrent = movie.torrents[0];

                            var content = {
                                title: movie.title,
                                imdb: movie.imdb_code,
                                contentType: "video",
                                duration: movie.runtime * 60,
                                description: movie.summary,
                                thumbnails: [movie.medium_cover_image],
                                url: torrent.url,
                                hash: torrent.hash,
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
