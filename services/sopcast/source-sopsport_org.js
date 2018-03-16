(function () {
    const request = require("request");
    const urlObject = require("url");

    var SopsportOrg = {
        name: "sopsport.org",
        getSearchFilterOptions: function() {
            return {
              searchable: false,
              allowBlankKeyword: true,
              genre: [],
              sortBy: [],
              quality: []
            };
        },
        find: function () {
            return new Promise(function (resolve, reject) {
                request("http://sopsport.org/", function (error, response, body) {
                    if (error) {
                        reject(error);
                        return;
                    }

                    if (!response || response.statusCode != 200 || !body) {
                        reject(new Error("Invalid response"));
                        return;
                    }

                    //parse body
                    var re = /"(http:\/\/sopsport.org\/live\/[^"]+)"/g;
                    var match = null;
                    var urls = [];
                    while (match = re.exec(body)) {
                        var url = match[1];
                        if (urls.indexOf(url) < 0) urls.push(url);
                    }

                    var index = -1;
                    var contents = [];
                    var next = function () {
                        index ++;
                        if (index >= urls.length) {
                            resolve(contents);
                            return;
                        }

                        var url = urls[index];

                        request(url, function (error, response, body) {
                            try {
                                if (error || !response || response.statusCode != 200 || !body) return;

                                var sopURLs = [];
                                var sopRE = /<div class="sop_info"><a href="(sop:[^"]+)"/g;
                                while (match = sopRE.exec(body)) {
                                    var sopURL = match[1];
                                    if (sopURLs.indexOf(url) < 0) sopURLs.push(sopURL);
                                }

                                if (sopURLs.length == 0) return;

                                var content = {
                                    title: "",
                                    contentType: "video",
                                    duration: null,
                                    description: "",
                                    thumbnails: [],
                                    url: sopURLs,
                                    extras: {}
                                }

                                var teamLogoRe = /<div class="logo_team"><img src="([^"]+)"/g;
                                var match = null;
                                while (match = teamLogoRe.exec(body)) {
                                    content.thumbnails.push(urlObject.resolve(url, match[1]));
                                }

                                var teamNameRe = /<div class="name_team">([^<]+)</g;
                                while (match = teamNameRe.exec(body)) {
                                    if (content.title) content.title += " - ";
                                    content.title += match[1];
                                }

                                contents.push(content);
                            } catch (e) {
                                console.error(e);
                            } finally {
                                next();
                            }
                        });
                    };

                    next();
                });
            });
        }
    };

    module.exports = SopsportOrg;
})();
