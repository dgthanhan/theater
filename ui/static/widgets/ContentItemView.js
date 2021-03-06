function ContentItemView() {
    BaseApplicationView.call(this);
    ContentItemView.instance = this;

    this.bind("click", this.play);
}

__extend(BaseApplicationView, ContentItemView);

ContentItemView.prototype.setContent = function(content) {
    this.content = content;

    var isFake = content.page;

    Dom.setInnerText(this.title, this.content.title);
    if (!isFake) {
        if (this.content.rating) {
            Dom.setInnerText(this.rating, this.content.rating);
        } else {
            Dom.addClass(this.rating, "NoInfo");
        }
        Dom.setInnerText(this.description, this.content.year || "");
    } else {
        Dom.addClass(this.rating, "NoInfo");
    }
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

    if (!this.content.page && this._contentLisView) {

        var playDialog = new ContentItemDialog();
        playDialog.open(this.content);

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
