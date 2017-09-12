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
    if (this.content.thumbnails != null && this.content.thumbnails.length > 0) {
      for (var url of this.content.thumbnails) {
          var imageView = new ImageView().into(this.thumbnailList);
          imageView.setCenterCrop(this.content.thumbnails.length == 1);
          imageView.setUrl(url);
      }
    }
};

ContentItemView.prototype.play = function() {
    var thiz = this;
    if (!this.content.page) {
      API.get("/api/play", { service: this.content.type, url: this.content.url}).then(function () {
          console.log("Play requested");
      });
    } else if (this._contentLisView) {
        var searchView = SearchView.instance;
        var options = searchView.getCurrenSearchOptions();
        console.log("Current search option: " + options);
        var listView = this._contentLisView;
        API.get("/api/contents",

        {
          service: this.content.type,
          term: options.term,
          quality:options.quality,
          genre: options.genre,
          sortBy: options.sortBy,
          orderBy: options.orderBy,
          page: this.content.page,
          limit: this.content.limit,
          refresh: "true"})

          .then(function (moreItems) {
              console.log("Load more item: " + moreItems);

              listView.node().removeChild(thiz.node());

              listView.setContents(moreItems, false);
              
        });
    }
};
