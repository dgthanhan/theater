(function () {
    var Manager = {
        services: [],
        serviceMap: {},
        registerService: function (service) {
            this.services.push(service);
            this.serviceMap[service.type] = service;
        }
    };
    
    Manager.registerService(require("sopcast/module.js"));
    Manager.registerService(require("torrent/module.js"));
    Manager.registerService(require("youtube/module.js"));
    
    module.exports = Manager;
})();
