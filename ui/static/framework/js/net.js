var net = (function() {
    window.__busyIndicator = {
        busy : function() {
        },
        unbusy : function() {
        }
    }

    function requestForXML(url, params, handler, silent) {
        if (!silent) window.__busyIndicator.busy();

        var request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if (request.readyState == XMLHttpRequest.DONE) {

                try {
                    if (request.status == 200) {
                        var xml = Dom.parseDocument(request.responseText);
                        handler(xml);
                    } else {
                        handler(null, {
                            status : request.status
                        });
                    }
                } finally {
                    if (!silent) window.__busyIndicator.unbusy();
                }
            }
        };

        request.open(params ? "POST" : "GET", url, true);
        request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

        var body = params ? "" : null;
        for ( var name in params) {
            if (body) body += "&";
            body += name + "=" + encodeURIComponent(params[name]);
        }

        request.send(body);
    }

    return {
        requestForXML : requestForXML
    };
})();
