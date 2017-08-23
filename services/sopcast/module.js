(function () {

    function SopcastService() {
        this.type = SopcastService.TYPE;
        this.name = "Sopcast";
    }
    
    SopcastService.TYPE = "sopcast";
    
    SopcastService.protoype.findAvailableContents = function () {
        return new Promise(function (resolve, reject) {
            resolve([
                {
                    type: SopcastService.TYPE,
                    title: "MANU vs Chelsea",
                    contentType: "video",
                    duration: null,
                    description: "EPL round 3 - Saturday 21:45",
                    thumbnail: "http://sopsport.org/wp-content/themes/news_site/images/teams_logo/CSKA.png",
                    url: "sop://broker.sopcast.com:3912/80562",
                    extras: {}
                }
            ]);
        });
    };
    
    SopcastService.protoype.start = function (content) {
    };
    SopcastService.protoype.terminate = function () {
    };
    
    SopcastService.protoype.getCurrentStatus = function () {
        //IDLE, PREPARING, SERVING
    };
    
    module.exports = new SopcastService();
})();

