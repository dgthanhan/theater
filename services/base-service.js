function BaseService() {

}

BaseService.prototype.getContents = function (options) {
    console.log("getContents called on base service", this.type, options);
    if (!options) options = {};
    if (!options.forceRefresh && this.cachedContents) {
        return Promise.resolve(this.cachedContents);
    }
    return this.findAvailableContents(options).then(function (contents) {
        console.log("Caching content for ", this.type, contents.length);
        this.cachedContents = contents;
        return contents;
    }.bind(this));
};

module.exports = BaseService;
