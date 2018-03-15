function SystemStatusDialog() {
    BaseDialog.call(this);

    this.bind("click", function () {
        API.get("/api/replay").then(function () {
        });
    }, this.playButton);
    this.bind("click", function () {
        API.get("/api/stop").then(function () {
        });
    }, this.killButton);
}

__extend(BaseDialog, SystemStatusDialog);

SystemStatusDialog.prototype.getDialogActions = function () {
    return [{
        type: "cancel", title: "Close",
        isCloseHandler: true,
        run: function () { return true; }
    }];
};
SystemStatusDialog.prototype.setup = function (status) {
    this.status = status;
    this.title = "Backend Status (" + status.service.type + ")";
    if (status && status.service && status.service.backend) {
        var backend = status.service.backend;
        Dom.setInnerText(this.streamURL, backend.url ? backend.url : "");
        this.backendStatus.innerHTML = Dom.htmlEncode(backend.message || "") + "<br/>" + Dom.htmlEncode(backend.details || "");
    } else {
        Dom.setInnerText(this.streamURL, "");
        this.backendStatus.innerHTML = "(Status not available)";
    }
};
