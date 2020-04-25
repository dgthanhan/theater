(function () {
    const request = require("request");
    var POPCORN = {
        name: "popcorn",
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
                        {name: "Year",        type: "year",         defaultSort: "-1"},
                        {name: "Last Added",  type: "last added" ,  defaultSort: "1"},
                        {name: "Title",       type: "title",        defaultSort: "1"},
                        {name: "Trending",    type: "trending",     defaultSort: "1"},
                        {name: "Rating",      type: "rating",       defaultSort: "-1"}
                    ],

            };
        },
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
                var limit = options.limit || 50;
                var url = "https://tv-v2.api-fetch.sh/movies/" + page + "?keywords=" + encodeURIComponent(keyword);

                if (genre.length > 0) {
                    url += "&genre=" + encodeURIComponent(genre);
                }
                //1 or -1
                var order = options.order || "1";
                url += "&order=" + order;
                if (sortBy.length > 0) {
                    url = url +  "&sort=" + sortBy;
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
                    var data = JSON.parse(body);
                    var movies = data;//data.data.movies;

                    var contents = [];
                    if (movies != null && movies.length > 0) {
                        for (var movie of movies) {
                            if (!movie.torrents || !movie.torrents.en) continue;
                            console.log("movie", movie.torrents);
                            var fullhd = movie.torrents.en["1080p"];
                            var hd = movie.torrents.en["720p"];
                            var video = fullhd ? fullhd : hd;
                            if (!video) continue;
                            var content = {
                                title: movie.title,
                                imdb: movie.imdb_code || movie.imdb_id,
                                contentType: "video",
                                duration: parseInt(movie.runtime, 10) * 60,
                                description: movie.summary || movie.synopsis,
                                thumbnails: [movie.medium_cover_image || (movie.images && movie.images.poster ? movie.images.poster : "")],
                                url: movie._id,
                                hash: movie._id,
                                year: movie.year,
                                rating: movie.rating.percentage / 10,
                                watching: movie.rating.watching,
                                extras: {
                                    torrents: [{quality: fullhd ? "1080p" : "", size: fullhd ? fullhd.filesize : "", url : fullhd ? fullhd.url : ""},
                                                {quality: hd ? "720p" : "", size: hd ? hd.filesize : "", url : hd ? hd.url : ""}]
                                }

                            };
                            contents.push(content);
                        }
                    }
                    var hasMore = movies.length == 50;
                    console.log("Has more items " + hasMore);
                    if (hasMore) {
                        //Item to load more
                        contents.push({title: "Load more...", description: "", page: page + 1, limit: limit});
                    }
                    resolve(contents);
                });
            });
        }
    };

    module.exports = POPCORN;
})();
