function TabPane() {
    BaseTemplatedWidget.call(this);
    this.headers = [];
    this.activeTabHeader = null;

    this.bind("click", this.handleHeaderClick, this.header);
    this.bind("dblclick", this.handleHeaderClick, this.header);
    this.bind("e:SizeChange", this.ensureSizing, this.content);
}

__extend(BaseTemplatedWidget, TabPane);

TabPane.prototype.setContentFragment = function (fragment) {
    for (var i = 0; i < fragment.childNodes.length; i ++) {
        var node = fragment.childNodes[i];
        if (!node.nodeName || !node.getAttribute) continue;

        var title = node.getAttribute("tab-title");
        this.addTab(title, node);
    }

};
TabPane.prototype.addTab = function (title, contentNode) {
    var header = document.createElement("div");
    Dom.addClass(header, "TabHeader");
    header.appendChild(document.createTextNode(title));

    this.header.appendChild(header);
    this.content.appendChild(contentNode);

    header._contentNode = contentNode;
    contentNode._header = header;
    Dom.addClass(contentNode, "TabBody");

    this.headers.push(header);

    if (!this.activeTabHeader) this.activateTab(header);
};
TabPane.prototype.activateTab = function (header) {
    for (var i = 0; i < this.headers.length; i ++) {
        var h = this.headers[i];
        if (h == header) {
            Dom.addClass(h, "ActiveTab");
            Dom.addClass(h._contentNode, "ActiveTab");
            this.activeTabHeader = header;
        } else {
            Dom.removeClass(h, "ActiveTab");
            Dom.removeClass(h._contentNode, "ActiveTab");
        }
    }
    Dom.emitEvent("e:TabChange", this.node());
    header.setAttribute("accessed", "true");

    BaseWidget.signalOnSizeChangedRecursively(this.node());
};
TabPane.prototype.handleHeaderClick = function (event) {
    console.log(event);
    var header = Dom.findUpwardForNodeWithData(event.target, "_contentNode");
    if (!header) return;
    if (this.allowClose && event.type == "dblclick" && (!header.canClose || header.canClose())) {
        var other = header.nextSibling;
        if (!other) other = header.previousSibling;
        header._contentNode.parentNode.removeChild(header._contentNode);
        header.parentNode.removeChild(header);
        if (other) this.activateTab(other);
    } else {
        this.activateTab(header);
    }
};
TabPane.prototype.getActiveTabPane = function () {
    if (!this.activeTabHeader) return null;
    return this.activeTabHeader._contentNode;
};
TabPane.prototype.setActiveTabPane = function (pane) {
    for (var i = 0; i < this.headers.length; i ++) {
        var h = this.headers[i];
        if (h._contentNode == pane) {
            this.activateTab(h);
            return;
        }
    }
};
TabPane.prototype.onSizeChanged = function () {
	this.ensureSizing();
};
TabPane.prototype.ensureSizing = function () {
    if (this.isFillView()) return;

    var w = Dom.getOffsetWidth(this.node()) - 2;
    var h = 0;

    for (var i = 0; i < this.headers.length; i ++) {
        var contentNode = this.headers[i]._contentNode;
        Dom.removeClass(contentNode, "Measured");
        var cw = Dom.getOffsetWidth(contentNode);
        var ch = Dom.getOffsetHeight(contentNode);

        w = Math.max(w, cw);
        h = Math.max(h, ch);
    }

    this.content.style.width = w + "px";
    this.content.style.height = h + "px";

    for (var i = 0; i < this.headers.length; i ++) {
        var contentNode = this.headers[i]._contentNode;
        Dom.addClass(contentNode, "Measured");
    }
};
TabPane.prototype.isFillView = function () {
    return this.node().getAttribute("flex") ? true : false;
};
TabPane.prototype.onAttached = function () {
    if (this.isFillView()) {
        this.content.setAttribute("flex", "1");
        this.content.style.display = "flex";
        return;
    }

    this.ensureSizing();
    var thiz = this;
    window.setTimeout(function () {
        thiz.ensureSizing();
    	BaseWidget.signalOnSizeChangedRecursively(thiz.node());
    }, 100);
};
