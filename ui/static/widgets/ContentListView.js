function ContentListView() {
    BaseApplicationView.call(this);
    ContentListView.instance = this;
}

__extend(BaseApplicationView, ContentListView);

ContentListView.prototype.onAttached = function() {
};
ContentListView.prototype.setContents = function(contents, reset) {
    var clear = typeof(reset) === "undefined" ? true : reset;
    if (clear) {
        this.node().innerHTML = "";
    }
    for (var content of contents) {
        var contentView = new ContentItemView().into(this.node());
        contentView._contentLisView = this;

        contentView.setContent(content);
    }
};
