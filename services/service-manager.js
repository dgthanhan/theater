(function () {
    var services = [];
    var serviceMap = {};

    var Manager = {
        registerService: function (service) {
            services.push(service);
            serviceMap[service.type] = service;
        },
        getService: function (type) {
            return serviceMap[type];
        }
    };

    Manager.registerService(require("./sopcast/module.js"));
    // Manager.registerService(require("torrent/module.js"));
    // Manager.registerService(require("youtube/module.js"));
    Manager.getServices = function () {
        return services;
    };

    module.exports = Manager;
})();
