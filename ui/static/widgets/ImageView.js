function ImageView() {
    BaseApplicationView.call(this);
    ImageView.instance = this;

    this.centerCrop = true;

    this.bind("load", function () {
        var w = this.image.naturalWidth;
        var h = this.image.naturalHeight;
        var W = this.node().offsetWidth;
        var H = this.node().offsetHeight;

        var r = this.centerCrop ? Math.min(w / W, h / H) : Math.max(w / W, h / H);
        w = Math.round(w / r);
        h = Math.round(h / r);

        var dx = (W - w) / 2;
        var dy = (H - h) / 2;

        this.image.style.width = w + "px";
        this.image.style.height = h + "px";
        this.image.style.top = dy + "px";
        this.image.style.left = dx + "px";
        this.image.style.display = "inline-block";
    }, this.image);
}

__extend(BaseApplicationView, ImageView);
ImageView.prototype.setCenterCrop = function(centerCrop) {
    this.centerCrop = centerCrop;
};
ImageView.prototype.onSizeChanged = function () {
    console.log("size changed");
}
ImageView.prototype.onAttached = function() {
    this.attached = true;
    if (this.pendingURL) {
        this.image.style.display = "none";
        this.image.src = this.pendingURL;

        this.pendingURL = null;
    }
};
ImageView.prototype.setUrl = function(url) {
    if (this.attached) {
        this.image.style.display = "none";
        this.image.src = url;
    } else {
        this.pendingURL = url;
    }
};
