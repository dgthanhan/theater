function ContentItemDialog() {
    BaseDialog.call(this);
    this.title = "Play Media";
    var thiz = this;
    this.bind("click", function () {
        var link = thiz.linkCombo.getSelectedItem();
        API.get("/api/play", {service: thiz.content.type, url: thiz.content.url, selectedUrl: link ? link.url : null}).then(function () {
            thiz.close();
        });
    }, this.playButton);
    this.bind("click", function () {
        API.get("/api/stop").then(function () {
        });
    }, this.killButton);

    this.linkCombo.renderer = function(item, selected) {
        return item.quality && item.size ? (item.quality  + " (" + item.size + ")") : item.url;
    }
}

__extend(BaseDialog, ContentItemDialog);

ContentItemDialog.prototype.getDialogActions = function () {
    return [{
        type: "cancel", title: "Close",
        isCloseHandler: true,
        run: function () { return true; }
    }];
};
ContentItemDialog.prototype.setup = function (media) {
    this.content = media;
    this.contentItemView.setContent(this.content)
    var thiz = this;
    API.get("/api/fetch/playback", {
      service: this.content.type,
      url: this.content.url
    }).then(function (result) {
        var videos = result.playableLinks;

        console.log(videos);

        thiz.linkCombo.setItems(videos);

    });

};
