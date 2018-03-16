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
SystemStatusDialog.prototype.onShown = function() {
    this.scale.invalidate();
}

SystemStatusDialog.prototype.setup = function (status) {
    this.status = status;
    console.log(this.status);
    if (!this.scale) {
        this.scale = new widget.Scale(this.scaleContainer, {onValueChangeFinished: function(value) {
        }});
    }
    if (this.status.content) {
        this.scale.setMax(this.status.content.duration * 1000);
        this.scale.setValue(40000);
    }
    this.title = "Backend Status" + (status.service && status.service.type ? " (" + status.service.type + ")" : "");
    if (status && status.service && status.service.backend) {
        var backend = status.service.backend;
        Dom.setInnerText(this.streamURL, backend.url ? backend.url : (this.status.content.selectedUrl || ""));
        this.backendStatus.innerHTML = Dom.htmlEncode(backend.message || backend.status) + "<br/>" + Dom.htmlEncode(backend.details || "");
    } else {
        Dom.setInnerText(this.streamURL, "");
        this.backendStatus.innerHTML = "(Status not available)";
    }
};
