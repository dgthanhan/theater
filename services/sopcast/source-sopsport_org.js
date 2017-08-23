(function () {
    const request = require("request");
    var SopsportOrg = {
        name: "sopsport.org",
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
                        urls.push(match[1]);
                    }

                    var index = -1;
                    var contents = [];
                    var next = function () {
                        index ++;
                        if (index >= urls.length) {
                            resolve(contents);
                            return;
                        }

                        request("http://sopsport.org/", function (error, response, body) {
                            try {
                                if (error || !response || response.statusCode != 200 || !body) return;

                                var sopMatch = /<div class="sop_info"><a href="(sop:[^"]+)"/.match(body);
                                if (!sopMatch) return;

                                var content = {
                                    title: "",
                                    contentType: "video",
                                    duration: null,
                                    description: "",
                                    thumbnails: [],
                                    url: sopMatch[1],
                                    extras: {}
                                }

                                var teamLogoRe = /<div class="logo_team"><img src="([^"]+)"/g;
                                var match = null;
                                while (match = teamLogoRe.exec(body)) {
                                    content.thumbnails.push(match[1]);
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
