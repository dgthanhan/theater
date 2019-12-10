function ContentItemDialog() {
    BaseDialog.call(this);
    this.title = "Media Information";
    var thiz = this;

    this.bind("click", function () {
        thiz.play(0);
    }, this.playButton);

    this.bind("click", function () {
        var buffer = 5;
        Dialog.confirm("Preload video before play?", "Preload " + buffer +"% video before send it to player"
        ,"Preload", function() {
            thiz.play(buffer);
        },
        "Cancel", function(){});
    }, this.duration);

    this.linkCombo.renderer = function(item, selected) {
        return item.quality && item.size  ? (item.quality + " [" + (item.type ? (item.type + " - ") : "") + item.size + "]") : item.quality;
    }
    this.langCombo.renderer = function(item, selected) {
        return item.name;
    }
    this.langCombo.setItems([{name: "English", key: "en"}, {name: "Tiếng Việt", key: "vi"}, { name: "No Subtitle", key: "nosub"}])

    this.playerManager.renderer = function(item, selected) {
        return "" + item.name;
    };

    this.playerManager.comparer = function(a, b) {
        return a.name == b.name;
    };
    API.get("/api/players").then(function (data) {
        thiz.playerManager.setItems(data.players);
        thiz.playerManager.selectItemIfContains({name: data.activePlayer});
    }).catch(function (e) {
        console.log(e);
    });
}

__extend(BaseDialog, ContentItemDialog);

ContentItemDialog.prototype.play = function(buffer) {
    var thiz = this;
    var link = thiz.linkCombo.getSelectedItem();
    var lang = thiz.langCombo.getSelectedItem();
    var player = thiz.playerManager.getSelectedItem();
    API.get("/api/play", {
        service: thiz.content.type,
        url: thiz.content.url,
        selectedUrl: link ? link.url : null,
        lang: lang.key,
        player: player ? player.name : "",
        expectedDownloaded: buffer
    }).then(function () {
        thiz.close();
    });
}
ContentItemDialog.prototype.getDialogActions = function () {
    return [
        {
           type: "cancel", title: "Close",
            isCloseHandler: true,
            run: function () { return true; }
        },
        {   type: "accept",
            title: "Play",
            run: function () { return false; }
       }];
};
ContentItemDialog.prototype.onShown = function() {
    Dom.addClass(this.dialogFrame, "ContentItemDialog");
}
ContentItemDialog.prototype.setup = function (media) {
    this.content = media;
    this.posterImage.setUrl(this.content.thumbnails && this.content.thumbnails.length > 0 ? this.content.thumbnails[0] : "");
    if (this.content.imdb) {
        this.imdbLink.href = "http://www.imdb.com/title/" + this.content.imdb + "/";
    } else {
        Dom.addClass(this.imdbPane, "NoResult")
    }
    Dom.setInnerText(this.mediaTitle, this.content.title);
    Dom.setInnerText(this.mediaDescription, this.content.description || "");
    Dom.setInnerText(this.rating, this.content.rating || "");
    Dom.setInnerText(this.year, this.content.year || "");
    var playText = "Play" + (this.content.watching && this.content.watching > 0 ? " (" + this.content.watching + "+)" : " (+1)");
    this.playButton.innerHTML = "<i class=\"mdi mdi-play\" />" + playText;
    if (this.content.duration > 0) {
        Dom.setInnerText(this.duration, (this.content.duration / 60) + " mins");
    }
    var thiz = this;
    API.get("/api/fetch/playback", {
      service: this.content.type,
      url: this.content.url
    }).then(function (result) {
        var videos = result ? result.playableLinks : null;
        if (!videos) {
            Dom.addClass(thiz.formatPane, "NoResult");
            Dom.addClass(thiz.playButton, "NoPlayableLinks");
        } else {
            thiz.linkCombo.setItems(videos);
        }
    });

};
