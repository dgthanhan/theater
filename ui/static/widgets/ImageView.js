function ImageView() {
    BaseApplicationView.call(this);
    ImageView.instance = this;

    this.bind("load", function () {
        console.log("WxH", this.image.naturalWidth, this.image.naturalHeight);
        var w = this.image.naturalWidth;
        var h = this.image.naturalHeight;
        var W = this.node().offsetWidth;
        var H = this.node().offsetHeight;

        var r = Math.min(w / W, h / H);
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

ImageView.prototype.setUrl = function(url) {
    window.setTimeout(function () {
        this.image.style.display = "none";
        this.image.src = url;
    }.bind(this), 10);
};
