function SearchView() {
    BaseApplicationView.call(this);

    SearchView.instance = this;

    this.bind("click", this.search, this.searchButton);

    this.mediaSourceManager.renderer = function(source) {
        return source.name;
    }
    this.genreManager.renderer = function(genre, forSelectedItem) {
      return forSelectedItem ?  "Genre: " + genre.name : genre.name;
    }
    this.qualityManager.renderer = function(quality, forSelectedItem) {
      return forSelectedItem ? "Video Quality: " + quality.name : quality.name;
    }
    this.sortByManager.renderer = function(sortBy, forSelectedItem) {
      return forSelectedItem ? "Sort by: " +  sortBy.name : sortBy.name;
    }
}

__extend(BaseApplicationView, SearchView);

SearchView.prototype.onAttached = function() {
    var appView = AppView.instance;
    var thiz = this;

    this.genreManager.setItems([{name: "All Genre", type: ""},
                              {name: "Action", type: "Action"},
                              {name: "Animation", type: "Animation"},
                              {name: "Advanture", type: "Advanture"},
                              {name: "Biography", type: "Biography"},
                              {name: "Comedy", type: "Comedy"},
                              {name: "Crime", type: "Crime"},
                              {name: "Documentary", type: "Documentary"},
                              {name: "Drama", type: "Drama"},
                              {name: "Family", type: "Family"},
                              {name: "Fantasy", type: "Fantasy"},
                              {name: "Film-Noir", type: "Film-Noir"},
                              {name: "History", type: "History"},
                              {name: "Horror", type: "Horror"},
                              {name: "Music", type: "Music"},
                              {name: "Musical", type: "Musical"},
                              {name: "Mystery", type: "Mystery"},
                              {name: "Romance", type: "Romance"},
                              {name: "Sci-Fi", type: "Sci-Fi"},
                              {name: "Sport", type: "Sport"},
                              {name: "Thriller", type: "Thriller"},
                              {name: "War", type: "War"},
                              {name: "Western", type: "Western"}]);

    this.qualityManager.setItems([{name: "All Quality", type: ""},
                                  {name: "HD 720p", type: "720p"},
                                  {name: "HD 1080p", type: "1080p"},
                                  {name: "3D", type: "3D"}]);

    this.sortByManager.setItems([
      {type: "date_added", name : "Date Added" },
      {type: "title", name: "Title"},
      {type: "year", name: "Year"},
      {type: "rating", name :"Rating" }]);


    API.get("/api/services").then(function (services) {
        var items = [];
        items.push({name: "All services"});

        appView.services = services;
        thiz.mediaSourceManager.setItems(items.concat(services));

        thiz.search();

    });
};
SearchView.prototype.getCurrenSearchOptions = function() {
    var options = {
      term:  this.searchText.value,
      genre: this.genreManager.getSelectedItem() == null ? '' : this.genreManager.getSelectedItem().type,
      quality: this.qualityManager.getSelectedItem().type == null ? '' : this.qualityManager.getSelectedItem().type,
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
    if (service.name === "All services") {
        appView.init(options, appView.services);
    } else {
        appView.load(options, service);
    }
}
