var serviceManager = require("./services/service-manager.js");

var service = serviceManager.getService("sopcast");

service.findAvailableContents().then(function (items) {
    var item = items[0];
    console.log(item);
    //service.start(item);
}).catch(function (e) {
    console.error(e);
});


//http://127.0.0.1:12001/jsonrpc?request={%22jsonrpc%22:%222.0%22,%22id%22:%221%22,%22method%22:%22Player.Open%22,%22params%22:{%22item%22:{%22file%22:%22http://clips.vorwaerts-gmbh.de/VfE_html5.mp4%22}}}
