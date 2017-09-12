function AppView() {
    BaseApplicationView.call(this);
    AppView.instance = this;
    this.bind("click", this.toggleSearch, this.searchButton);
    this.searchViewOpened = false;
}

__extend(BaseApplicationView, AppView);

AppView.prototype.onAttached = function() {
    var thiz = this;
};
AppView.prototype.toggleSearch = function () {
    this.searchViewOpened = !this.searchViewOpened;
    if (this.searchViewOpened) {
        Dom.removeClass(this.searchView.node(), "Disabled");
    } else {
        Dom.addClass(this.searchView.node(), "Disabled");
    }
    this.searchButton.innerHTML = this.searchViewOpened ? "<i class='mdi mdi-close' />" : "<i class='mdi mdi-magnify' />";
}
AppView.prototype.loadContentForService = function (service, options, contentListView) {
    API.get("/api/contents",

    { service: service.type,
      term: options.term,
      quality:options.quality,
      genre: options.genre,
      sortBy: options.sortBy,
      orderBy: options.orderBy,
      limit: options.limit,
      page: options.page || "",
      refresh: "true"})

      .then(function (contents) {
        contentListView.setContents(contents);
    });
};
AppView.prototype.init = function(options) {
    if (this.services == null || this.services.length == 0) return;

    for (var service of this.services) {
        this.load(options, service);
    }
}
AppView.prototype.load = function(options, source) {
    var title = document.createElement("strong");
    Dom.setInnerText(title, source.name);
    this.allContentListView.appendChild(title);
    var contentListView = new ContentListView().into(this.allContentListView);
    this.loadContentForService(source, options, contentListView);
}
