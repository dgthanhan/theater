(function () {
    var Manager = {
        services: [],
        serviceMap: {},
        registerService: function (service) {
            this.services.push(service);
            this.serviceMap[service.type] = service;
        },
        getService: function (type) {
            return this.serviceMap[type];
        }
    };

    Manager.registerService(require("./sopcast/module.js"));
    // Manager.registerService(require("torrent/module.js"));
    // Manager.registerService(require("youtube/module.js"));

    module.exports = Manager;
})();
