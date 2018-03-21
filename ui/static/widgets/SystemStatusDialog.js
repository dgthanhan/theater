function SystemStatusDialog() {
    BaseDialog.call(this);
    var thiz =  this;
    this.bind("click", function () {
        API.get("/api/replay").then(function () {
        });
    }, this.replayButton);
    this.bind("click", function () {
        API.get("/api/stop").then(function () {
            thiz.close();
        });
    }, this.killButton);

    this.bind("click", function () {
        API.get("/api/pause").then(function () {
        });
    }, this.pauseButton);
    this.slider.min = 0;
    this.slider.step = 1000;

    this.bind("input", function(e) {
        var v = thiz.slider.value;
        var moving = thiz.kodiTimeFromSeconds(v/1000);
        thiz.seekTo.innerHTML = thiz.formatTime(moving);
        if (thiz.seekFunction) {
            clearTimeout(thiz.seekFunction);
        }
        thiz.pendingSeek = true;
        thiz.seekFunction = setTimeout(function() {
            console.log("SeekTo --> " + (v/1000) + "s");
            API.get("/api/seekTo", {seconds: v/1000}).then(function (o) {
                console.log(o);
                thiz.seekFunction = null;
                thiz.seekTo.innerHTML = "";
                setTimeout(function(){
                    thiz.pendingSeek = false;
                }, 10000);
            });
        }, 1000);
        thiz.seekFunction.time = moving;

    }, this.slider);

    this.pendingSeek = false;
}

__extend(BaseDialog, SystemStatusDialog);

SystemStatusDialog.prototype.kodiTimeFromSeconds = function (seconds) {
    seconds = Math.round(seconds);
    var time = {};
    time.seconds = seconds % 60;

    seconds = Math.floor((seconds - time.seconds) / 60);
    time.minutes = seconds % 60;

    time.hours = Math.floor((seconds - time.minutes) / 60);

    return time;
}
SystemStatusDialog.prototype.getDialogActions = function () {
    return [{
        type: "cancel", title: "Close",
        isCloseHandler: true,
        run: function () { return true; }
    }];
};
SystemStatusDialog.prototype.setup = function (status) {
    this.status = status;
    var position = this.status.position;
    if (position) {
        this.elapsedInfo.innerHTML = this.formatTime(position.time);

        if (position.remaining) {
            this.durationInfo.innerHTML = this.formatTime(position.remaining);
        } else {
            this.durationInfo.innerHTML = this.formatTime(position.length);
        }
        var d = position.length.milliseconds + position.length.seconds * 1000 + position.length.minutes * 60 * 1000 +
            position.length.hours * 60 * 60 * 1000;

        var c = position.time.milliseconds + position.time.seconds * 1000 + position.time.minutes * 60 * 1000 +
            position.time.hours * 60 * 60 * 1000;

        this.slider.max = d;
        if (!this.pendingSeek) {
            this.slider.value = c;
        }
    } else {
        this.elapsedInfo.innerHTML = "00:00:00";
        this.durationInfo.innerHTML = "00:00:00";
    }

    this.title = "Backend Status" + (status.service && status.service.type ? " (" + status.service.type + ")" : "");
    if (status && status.service && status.service.backend) {
        var backend = status.service.backend;
        Dom.setInnerText(this.streamURL, backend.url ? backend.url : (this.status.content ? this.status.content.selectedUrl || "" : ""));
        this.backendStatus.innerHTML = Dom.htmlEncode(backend.message || backend.status) + "<br/>" + Dom.htmlEncode(backend.details || "");
    } else {
        Dom.setInnerText(this.streamURL, "");
        this.backendStatus.innerHTML = "(Status not available)";
    }
};
SystemStatusDialog.prototype.appendZeroIfNeeded = function (v) {
    if (v < 10) return "0" + v;
    return v;
}
SystemStatusDialog.prototype.formatTime = function (time) {
    return time.hours > 0 ? (this.appendZeroIfNeeded(time.hours) + ":" +
        this.appendZeroIfNeeded(time.minutes) + ":" + this.appendZeroIfNeeded(time.seconds))
        : (this.appendZeroIfNeeded(time.minutes) + ":" + this.appendZeroIfNeeded(time.seconds));
}
