function SearchView() {
    BaseApplicationView.call(this);

    SearchView.instance = this;
    var thiz = this;
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
    this.sourceManager.renderer = function(source, forSelectedItem) {
      return source.name;
    }
    this.bind("p:ItemSelected", function() {

        var source = thiz.sourceManager.getSelectedItem();
        if (!source) return;

        thiz.activeSource(source);

    }, this.sourceManager.node());

}

__extend(BaseApplicationView, SearchView);

SearchView.prototype.activeSource = function (source) {
    var thiz = this;
    var options = source.filterOptions;
    var searchable = options.searchable ? true : false;
    if (searchable) {
        thiz.genreManager.setItems(options.genre || []);
        if (options.quality) {
            thiz.qualityManager.setItems(options.quality || []);
            Dom.removeClass(thiz.qualityManager.node(), "Dirty");
        } else {
            Dom.addClass(thiz.qualityManager.node(), "Dirty");
        }
        thiz.sortByManager.setItems(options.sortBy || []);
    }
    thiz.setEnabled(searchable);

    if (options.allowBlankKeyword || thiz.searchText.value.trim()) {
        thiz.search();
    } else {
        AppView.instance.allContentListView.innerHTML = "";
    }

}
SearchView.prototype.onAttached = function() {
    var appView = AppView.instance;
    var thiz = this;
};
SearchView.prototype.selectSource = function(service) {
    this.service = service;
    var thiz = this;
    API.get("/api/search/options", {
      service: service.type
    }).then(function(sources) {

        thiz.sourceManager.setItems(sources);

        if (!sources || sources.length == 1) {
            Dom.addClass(thiz.sourceManager.node(), "Dirty");
        } else {
            Dom.removeClass(thiz.sourceManager.node(), "Dirty");
        }
        if (sources && sources.length >= 1) {
            thiz.activeSource(sources[0]);
        }
    });
}
SearchView.prototype.setEnabled = function(searchable) {
    Dom.toggleClass(this.node(), "Disabled", !searchable);
}

SearchView.prototype.getCurrenSearchOptions = function() {
    var options = {
      term:  this.searchText.value.trim(),
      genre: this.genreManager.getSelectedItem() == null ? "" : this.genreManager.getSelectedItem().type,
      quality: this.qualityManager.getSelectedItem() == null ? "" : this.qualityManager.getSelectedItem().type,
      sortBy: this.sortByManager.getSelectedItem() == null ? "" : this.sortByManager.getSelectedItem().type,
      order: this.sortByManager.getSelectedItem() == null ? "desc" : this.sortByManager.getSelectedItem().defaultSort,
      limit: 20,
      source: this.sourceManager.getSelectedItem() == null ? "" : this.sourceManager.getSelectedItem().name
    }
    return options;
}

SearchView.prototype.search = function() {
    var options = this.getCurrenSearchOptions();
    var appView = AppView.instance;
    appView.allContentListView.innerHTML = "";
    appView.load(options, this.service);
}
