(function () {
    var Common = {
        State: {
            Idle: 0,
            Preparing: 1,
            Serving: 2
        },
        findLANAddress: function () {
            const os = require("os");
            var ifaceMap = os.networkInterfaces();
            for (var name in ifaceMap) {
                var ifaceAddresses = ifaceMap[name];
                for (var address of ifaceAddresses) {
                    if (!address.internal && address.family === "IPV4" && address.address) {
                        return address.address;
                    }
                }
            }

            return null;
        }
    };

    module.exports = Common;
})();
