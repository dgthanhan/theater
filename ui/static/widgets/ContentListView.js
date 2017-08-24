function ContentListView() {
    BaseApplicationView.call(this);
    ContentListView.instance = this;
}

__extend(BaseApplicationView, ContentListView);

ContentListView.prototype.onAttached = function() {
};
ContentListView.prototype.setContents = function(contents) {
    this.node().innerHTML = "";
    for (var content of contents) {
        var contentView = new ContentItemView().into(this.node());
        contentView.setContent(content);
    }
};
