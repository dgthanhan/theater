function AppView() {
    BaseApplicationView.call(this);
    AppView.instance = this;
}

__extend(BaseApplicationView, AppView);

AppView.prototype.onAttached = function() {
    var thiz = this;
    this.allContentListView.innerHTML = "";
    API.get("/api/services").then(function (services) {
        for (var service of services) {
            var title = document.createElement("strong");
            Dom.setInnerText(title, service.name);
            thiz.allContentListView.appendChild(title);
            var contentListView = new ContentListView().into(thiz.allContentListView);
            thiz.loadContentForService(service, contentListView);
        }
    });
};
AppView.prototype.loadContentForService = function (service, contentListView) {
    API.get("/api/contents", { service: service.type }).then(function (contents) {
        contentListView.setContents(contents);
    });
};
