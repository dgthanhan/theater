(function () {
    const request = require("request");
    const os = require("os");
    const common = require("./services/common.js");

    function submit() {
        try {
            var serviceUrl = "http://" + common.findLANAddress() + ":12002/static/app.xhtml";
            var host = os.hostname();
            var url = "http://evolus.vn/d/post?id=theater&ip=" + escape(serviceUrl) + "&extra_host=" + escape(host);
            request(url, function (error, response, body) {
                if (!response || response.statusCode != 200) {
                    console.error(new Error("Invalid discovery response"));
                    return;
                }

                console.log("DISCOVERY DATA SUBMITTED.");
            });
        } finally {
            setTimeout(submit, 60000);
        }
    }

    module.exports = {
        start: submit
    };
})();
