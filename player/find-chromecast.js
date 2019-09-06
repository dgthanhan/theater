(function () {
    var mdns                  = require('mdns');
    var devices = [];
    function LookupChromeCastController(callback) {
        this.callback = callback;
    }
    LookupChromeCastController.prototype.lookup = function() {
        var thiz = this;
        var sequence = [
            mdns.rst.DNSServiceResolve(),
            mdns.rst.getaddrinfo({families: [4] })
        ];
        this.browser = mdns.createBrowser(mdns.tcp('googlecast'), {resolverSequence: sequence});
        this.browser.on('serviceUp', function(service) {
            console.log('found device "%s" at %s:%d', service.name, service.addresses[0], service.port);
            var device = {name: service.name, address: service.addresses[0], port: service.port};
            var added = false;
            for (var index in thiz.devices) {
                var d = thiz.devices[index];
                if (d.address == device.address) {
                    added = true;
                    break;
                }
            }
            if (!added) {
                devices.push(device);
                if (thiz.callback) thiz.callback(device);
            }
        });
        this.browser.start();
    };

    LookupChromeCastController.prototype.getAllPlayers = function() {
        return devices;
    };
    LookupChromeCastController.prototype.stopScan = function() {
        this.browser.stop();
    };
    module.exports = LookupChromeCastController;
})();
