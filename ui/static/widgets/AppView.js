function AppView() {
    BaseApplicationView.call(this);
    AppView.instance = this;
    this.searchViewOpened = false;

    var thiz = this;
    API.get("/api/services").then(function (services) {

        for (var service of services) {
            var tab = Dom.newDOMElement({
                _name: "hbox",
                _children: [{
                    _name: "span",
                    _text: service.name
                }]
            });
            thiz.sourceTab.appendChild(tab);

            tab._service = service;
            if (!thiz.defaultService) thiz.defaultService = service;
        }

        thiz.selectSource(thiz.defaultService);
    });

    this.bind("click", this.onTabClicked, this.sourceTab);
    this.count = 0;

    this.bind("click", function () {
        thiz.count++;
        if (thiz.count >= 5) {
            thiz.count = 0;
            Dialog.confirm("Reboot system?", "Reboot system to pull the newest Theater.", "Reboot", function() {
                API.get("/api/reboot").then(function () {});
            }, "Cancel" , function() {});
        }
    }, this.appIcon);
}

__extend(BaseApplicationView, AppView);

AppView.prototype.onAttached = function() {
    var thiz = this;
};
AppView.prototype.onTabClicked = function(event) {
    var service = Dom.findUpwardForData(event.target, "_service");
    if (!service) return;
    this.selectSource(service);
};
AppView.prototype.selectSource = function (service) {
    for (var child of this.sourceTab.childNodes) {
        if (child._service.type == service.type) {
            Dom.addClass(child, "Active");
        } else {
            Dom.removeClass(child, "Active");
        }
    }

    this.searchView.selectSource(service);
};
AppView.prototype.loadContentForService = function (service, options, contentListView) {
    Dom.addClass(this.node(), "Searching");
    var thiz = this;

    API.get("/api/contents",

    { service: service.type,
      term: options.term,
      quality:options.quality,
      genre: options.genre,
      sortBy: options.sortBy,
      order: options.order,
      limit: options.limit,
      source: options.source,
      page: options.page || "",
      refresh: "true"})

      .then(function (contents) {
          Dom.removeClass(thiz.node(), "Searching");
          contentListView.setContents(contents);
    }).catch(function () {
        Dom.removeClass(thiz.node(), "Searching");
    });
};
AppView.prototype.init = function(options) {
    if (this.services == null || this.services.length == 0) return;

    for (var service of this.services) {
        this.load(options, service);
    }
}
AppView.prototype.load = function(options, source) {
    var contentListView = new ContentListView().into(this.allContentListView);
    this.loadContentForService(source, options, contentListView);
}
