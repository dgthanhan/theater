function SearchView() {
    BaseApplicationView.call(this);

    SearchView.instance = this;

    this.bind("click", this.search, this.doSearchButton);
    this.bind("keyup", function(e){
        if (e.keyCode == 13) {
            SearchView.instance.search();
        }
    }, this.searchText);

    this.genreManager.renderer = function(genre, forSelectedItem) {
      if (!genre) return "";
      return genre.name;
    }
    this.qualityManager.renderer = function(quality, forSelectedItem) {
      if (!quality) return "";
      return quality.name;
    }
    this.sortByManager.renderer = function(sortBy, forSelectedItem) {
      if (!sortBy) return "";
      return "Sort: " + sortBy.name;
    }
}

__extend(BaseApplicationView, SearchView);

SearchView.prototype.onAttached = function() {
    var appView = AppView.instance;
    var thiz = this;
};
SearchView.prototype.selectSource = function(service) {
    this.service = service;
    var thiz = this;
    API.get("/api/search/options", {
      service: service.type
    }).then(function(options) {
          var searchable = options.searchable ? true : false;
          if (searchable) {
              thiz.genreManager.setItems(options.genre || []);
              thiz.qualityManager.setItems(options.quality || []);
              thiz.sortByManager.setItems(options.sortBy || []);
          }
          thiz.setEnabled(searchable);

          if (options.allowBlankKeyword || thiz.searchText.value.trim()) {
              thiz.search();
          } else {
              AppView.instance.allContentListView.innerHTML = "";
          }
    });
}
SearchView.prototype.setEnabled = function(searchable) {
    Dom.toggleClass(this.node(), "Disabled", !searchable);
}

SearchView.prototype.getCurrenSearchOptions = function() {
    var options = {
      term:  this.searchText.value,
      genre: this.genreManager.getSelectedItem() == null ? '' : this.genreManager.getSelectedItem().type,
      quality: this.qualityManager.getSelectedItem() == null ? '' : this.qualityManager.getSelectedItem().type,
      sortBy: this.sortByManager.getSelectedItem() == null ? '' : this.sortByManager.getSelectedItem().type,
      orderBy: "desc",
      limit: 20
    }
    return options;
}

SearchView.prototype.search = function() {
    var options = this.getCurrenSearchOptions();
    var appView = AppView.instance;
    appView.allContentListView.innerHTML = "";
    appView.load(options, this.service);
}
