function SearchView() {
    BaseApplicationView.call(this);

    SearchView.instance = this;

    this.bind("click", this.search, this.searchButton);
    this.bind("keyup", function(e){
        if (e.keyCode == 13) {
            SearchView.instance.search();
        }
    }, this.searchText);

    this.mediaSourceManager.renderer = function(source) {
        return source.name;
    }
    this.mediaSourceManager.options = {
        onItemSelected: function(fromUserAction) {
              if (!fromUserAction) return;
              var s = SearchView.instance.mediaSourceManager.getSelectedItem();
              console.log(s);
              SearchView.instance.selectSource(s);
        }
    }
    this.genreManager.renderer = function(genre, forSelectedItem) {
      if (!genre) return "";
      return forSelectedItem ?  "Genre: " + genre.name : genre.name;
    }
    this.qualityManager.renderer = function(quality, forSelectedItem) {
      if (!quality) return "";
      return forSelectedItem ? "Video Quality: " + quality.name : quality.name;
    }
    this.sortByManager.renderer = function(sortBy, forSelectedItem) {
      if (!sortBy) return "";
      return forSelectedItem ? "Sort by: " +  sortBy.name : sortBy.name;
    }
}

__extend(BaseApplicationView, SearchView);

SearchView.prototype.onAttached = function() {
    var appView = AppView.instance;
    var thiz = this;

    API.get("/api/services").then(function (services) {

        appView.services = services;
        thiz.mediaSourceManager.setItems(services);

        thiz.selectSource(thiz.mediaSourceManager.getSelectedItem());

    });
};
SearchView.prototype.selectSource = function(service) {
    var thiz = this;
    API.get("/api/search/options", {
      service: service.type
    }).then(function(options) {
          var searchable = options.searchable || false;
          if (searchable) {
              thiz.genreManager.setItems(options.genre || []);
              thiz.qualityManager.setItems(options.quality || []);
              thiz.sortByManager.setItems(options.sortBy || []);
          }
          thiz.setEnabled(searchable);

          thiz.search();
    });
}
SearchView.prototype.setEnabled = function(searchable) {
    console.log("Search able " + searchable);
    if (!searchable) {
        Dom.addClass(this.genreManager.node(), "Disabled");
        Dom.addClass(this.qualityManager.node(), "Disabled");
        Dom.addClass(this.sortByManager.node(), "Disabled");
        Dom.addClass(this.searchTermBox, "Disabled");
        Dom.addClass(this.filterBox, "Disabled");
    } else {
        Dom.removeClass(this.genreManager.node(), "Disabled");
        Dom.removeClass(this.qualityManager.node(),  "Disabled");
        Dom.removeClass(this.sortByManager.node(), "Disabled");
        Dom.removeClass(this.searchTermBox, "Disabled");
        Dom.removeClass(this.filterBox, "Disabled");
    }
}

SearchView.prototype.getCurrenSearchOptions = function() {
    var options = {
      term:  this.searchText.value,
      genre: this.genreManager.getSelectedItem() == null ? '' : this.genreManager.getSelectedItem().type,
      quality: this.qualityManager.getSelectedItem() == null ? '' : this.qualityManager.getSelectedItem().type,
      sortBy: this.sortByManager.getSelectedItem() == null ? '' : this.sortByManager.getSelectedItem().type,
      orderBy: "desc",
      limit: 10
    }
    return options;
}

SearchView.prototype.search = function() {
    var options = this.getCurrenSearchOptions();
    var service = this.mediaSourceManager.getSelectedItem();
    var appView = AppView.instance;
    appView.allContentListView.innerHTML = "";
    appView.load(options, service);
}
