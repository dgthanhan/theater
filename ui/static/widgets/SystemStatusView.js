function SystemStatusView() {
    BaseApplicationView.call(this);
    SystemStatusView.instance = this;

    this.ws = new WebSocket("ws://" + window.location.host + "/status");
    this.ws.onopen = function () {
        console.log("WS opened", thiz.ws);
    };

    var thiz = this;
    this.ws.onmessage = function (messageEvent) {
        thiz.setStatus(JSON.parse(messageEvent.data));
    };
}

__extend(BaseApplicationView, SystemStatusView);

SystemStatusView.prototype.setUrl = function(url) {
    this.image.style.display = "none";
    this.image.src = url;
};
SystemStatusView.prototype.setStatus = function (status) {
    this.thumbnailList.innerHTML = "";
    if (status.content) {
        for (var url of status.content.thumbnails) {
            var imageView = new ImageView().into(this.thumbnailList);
            imageView.setUrl(url);
        }

        Dom.setInnerText(this.title, status.content.title);
        Dom.setInnerText(this.description, status.content.description);
        this.originalLink.innerHTML = status.content.url;
        this.originalLink.setAttribute("href", status.content.url);


        this.currentContentPane.style.display = "flex";
    } else {
        this.currentContentPane.style.display = "none";
    }

    if (status.service) {
        Dom.setInnerText(this.playbackStatusMessage, status.playbackMessage);
        this.playbackStatusPane.style.visibility = "inherit";
        this.playbackStatusPane.setAttribute("status", status.service.status);
    } else {
        this.playbackStatusMessage.innerHTML = "&#160;";
        this.playbackStatusPane.style.visibility = "hidden";
    }
}
