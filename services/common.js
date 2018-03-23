(function () {
    var Common = {
        State: {
            Idle: "idle",
            Preparing: "preparing",
            Serving: "serving"
        },
        findLANAddress: function () {
            const os = require("os");
            var ifaceMap = os.networkInterfaces();
            for (var name in ifaceMap) {
                var ifaceAddresses = ifaceMap[name];
                for (var address of ifaceAddresses) {
                    if (!address.internal && address.family === "IPv4" && address.address) {
                        return address.address;
                    }
                }
            }

            return null;
        },

        kodiTimeToSeconds: function (time) {
            return (time.hours * 60 + time.minutes) * 60 + time.seconds;
        },

        kodiTimeFromSeconds: function (seconds) {
            seconds = Math.round(seconds);
            var time = {};
            time.seconds = seconds % 60;

            seconds = Math.floor((seconds - time.seconds) / 60);
            time.minutes = seconds % 60;

            time.hours = Math.floor((seconds - time.minutes) / 60);

            return time;
        }
    };

    module.exports = Common;
})();
