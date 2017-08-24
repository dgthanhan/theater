function ContentItemView() {
    BaseApplicationView.call(this);
    ContentItemView.instance = this;

    this.bind("click", this.play);
}

__extend(BaseApplicationView, ContentItemView);

ContentItemView.prototype.setContent = function(content) {
    this.content = content;
    Dom.setInnerText(this.title, this.content.title);
    Dom.setInnerText(this.description, this.content.description);

    this.thumbnailList.innerHTML = "";
    for (var url of this.content.thumbnails) {
        var imageView = new ImageView().into(this.thumbnailList);
        imageView.setUrl(url);
    }
};

ContentItemView.prototype.play = function() {
    API.get("/api/play", { service: this.content.type, url: this.content.url}).then(function () {
        console.log("Play requested");
    });
};
