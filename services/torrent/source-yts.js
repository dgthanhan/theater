(function () {
    const request = require("request");
    var YTS = {
        name: "yts",
        find: function () {
            return new Promise(function (resolve, reject) {
                request("https://yts.ag/api/v2/list_movies.json?sort_by=year&genre=action", function (error, response, body) {
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

                    for (var movie of movies) {
                        var content = {
                            title: movie.title,
                            contentType: "video",
                            duration: movie.runtime * 60,
                            description: movie.summary,
                            thumbnails: [movie.medium_cover_image],
                            url: movie.torrents[0].url,
                            hash: movie.torrents[0].hash,
                            extras: {
                                torrents: movie.torrents
                            }
                        };
                        contents.push(content);
                    }

                    resolve(contents);
                });
            });
        }
    };

    module.exports = YTS;
})();
