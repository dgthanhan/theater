(function () {
    const {State} = require("../common.js");
    const BaseService = require("../base-service.js");

    function ExternalVideoService() {
        this.type = ExternalVideoService.TYPE;
        this.name = "EXT";
        this.state = State.Idle;
        this.contents = [
        ];
        this.contentMap = {};
    }

    ExternalVideoService.TYPE = "external";
    ExternalVideoService.prototype = new BaseService();
    
    ExternalVideoService.prototype.add = function (content) {
        content.timestamp = new Date();
        content.contentType = "video";
        content.type = ExternalVideoService.TYPE;
        
        this.contents.unshift(content);
        this.contentMap[content.url] = content;
    };
    ExternalVideoService.prototype.start = function (data) {
        var content = data.content;
        return Promise.resolve({
            url: content.url,
            content: content
        });
    };

    ExternalVideoService.prototype.findAvailableContents = function (options) {
        return Promise.resolve(this.contents);
    };
    ExternalVideoService.prototype.findCachedContent = function (url) {
        console.log("Finding: " + url + " in ", this.cache);
        return this.contentMap ? this.contentMap[url] : {
            title: url,
            contentType: "video",
            type: ExternalVideoService.TYPE,
            duration: null,
            description: "",
            thumbnails: [],
            url: url,
            extras: {}
        };
    };
    ExternalVideoService.prototype.getCurrentStatus = function () {
        return this.state;
    };
    ExternalVideoService.prototype.terminate = function () {
        this.state = State.Idle;
    };
    
    ExternalVideoService.prototype.getSearchFilterOptions = function () {
        return [{name: "external", filterOptions: {searchable: true}}];
    };
    
    module.exports = new ExternalVideoService();
})();
