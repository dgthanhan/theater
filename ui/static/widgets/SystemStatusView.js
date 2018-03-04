function SystemStatusView() {
    BaseApplicationView.call(this);
    SystemStatusView.instance = this;
    this.isViewExpanded = true;
    this.ws = new WebSocket("ws://" + window.location.host + "/status");
    this.ws.onopen = function () {
        console.log("WS opened", thiz.ws);
    };

    var thiz = this;
    this.ws.onmessage = function (messageEvent) {
        thiz.setStatus(JSON.parse(messageEvent.data));
    };

    function loadStatus() {
        API.get("/api/status").then(function (status) {
            thiz.setStatus(status);
            setTimeout(loadStatus, 1000);
        }).catch(function () {
            setTimeout(loadStatus, 1000);
        });
    }

    loadStatus();

    this.bind("click", function () {
        new SystemStatusDialog().open(this.status);
    }, this.backendDetailButton);

    var thiz = this;
}

__extend(BaseApplicationView, SystemStatusView);

SystemStatusView.prototype.setUrl = function(url) {
    this.image.style.display = "none";
    this.image.src = url;
};
SystemStatusView.prototype.setStatus = function (status) {
    this.status = status;
    Dom.toggleClass(this.node(), "HasContent", status.content ? true : false);

    if (status.content) {
        if (status.content.url != this.lastContentURL) {
            this.thumbnailList.innerHTML = "";
            for (var url of status.content.thumbnails) {
                var imageView = new ImageView().into(this.thumbnailList);
                imageView.setCenterCrop(status.content.thumbnails.length == 1);
                imageView.setUrl(url);
            }

            Dom.setInnerText(this.contentTitle, status.content.title);
            Dom.setInnerText(this.contentDescription, status.content.description);

            this.lastContentURL = status.content.url;
        }
    }

    if (status.service) {
        Dom.setInnerText(this.playbackStatusMessage, status.playbackMessage);
        this.playbackStatusPane.style.visibility = "inherit";
        this.playbackStatusPane.setAttribute("status", status.service.status);
        Dom.setInnerText(this.backendStatusMessage, status.service.backend ? status.service.backend.backendSummary : "");
    } else {
        this.playbackStatusMessage.innerHTML = "&#160;";
        this.playbackStatusPane.style.visibility = "hidden";
        this.backendStatusMessage.innerHTML = "&#160;";
    }
}
