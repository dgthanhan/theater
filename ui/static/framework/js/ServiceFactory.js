if (typeof(console) == "undefined") {
    window.console = {
            log: function () {},
            trace: function () {}
    }
}
var FOO_SERVICE = "vn.evolus.evomed.crm.ajax.Foo";
var ServiceFactory = {};

ServiceFactory._serviceConfigs = {};
ServiceFactory.registerService = function(service, def) {
	ServiceFactory._serviceConfigs[service] = def;
	window["$" + service] = ServiceFactory.get(service);
};


function _handleGenericError(e) {
	console.info("Error: " + e);
	throw e;
}
function showProgress(visible, message) {
    if (visible) {
        defaultIndicator.busy(message);
    } else {
        defaultIndicator.done();
    }
	/*
	var progressContainer = document.getElementById("progressContainer");
	var progressMessage = document.getElementById("progressMessage");

	if (!progressContainer) {
		return;
	}
	progressContainer.style.display = visible ? "block" : "none";
	progressMessage.innerHTML = message ? message : "Tải dữ liệu";
	*/
}

function objectToXML(object) {
	if (object && object._isSystemLiteral) {
		return object.text;
	}
	if (object == null) {
		return "<null/>";
	}
	if (typeof(object) == "string") {
		return "<string>" + Dom.htmlEncode("" + object) + "</string>";
	}
	if (typeof(object) == "number") {
		return "<int>" + object + "</int>";
	}
	if (typeof(object) == "boolean") {
		return "<boolean>" + object + "</boolean>";
	}
	if (object instanceof Date) {
		return "<date>" + DateUtil.formatForSystem(object) + "</date>";
	}

    var s = "";

    for (var name in object) {
    	// check typeof(object) is array object
    	if(!object.slice) {
            var clazz = object[name].clazz ? (" class=\"" + object[name].clazz + "\"") : "";
            s += "<" + name + clazz + ">";
	        s += objectToXML(object[name]);
	        s += "</" + name + ">";
    	} else {
    		s += objectToXML(object[name]);
    	}
    }

    return s;
}
function objectToXMLValue(object) {

	if (object && object._isSystemLiteral) {
		return object.text;
	}
	if (object == null) {
		return "";
	}

	if (object._isSelfSerialized) {
		return object.getBodyXML();
	}

	if (object.valuezz != undefined) {
	    return object.valuezz;
	}
	if (typeof(object) == "string") {
		return Dom.htmlEncode("" + object);
	}
	if (typeof(object) == "number") {
		return object;
	}
	if (typeof(object) == "boolean") {
		return object;
	}
	if (object instanceof Date) {
		return  DateUtil.formatForSystem(object);
	}
	var s = "";

    for (var name in object) {
    	if (name == "_elementType" || name == "clazz") continue;

    	// check typeof(object) is array object
    	if (!object.slice) {
            var clazz = object[name] && object[name].clazz ? (" class=\"" + object[name].clazz + "\"") : "";
    		s += "<" + name + clazz + ">";
    		s += objectToXMLValue(object[name]);
    		s += "</" + name + ">";
    	} else {
    		var n = object[0]._elementType;
    		if (!n && typeof(object[0]) == "number") {
    			n = "int";
    		}

    		s += "<" + n + ">";
    		s += objectToXMLValue(object[name]);
    		s += "</" + n + ">";
    	}
    }

	 return s;
}
function _Literal(text) {
	this.text = text;
	this._isSystemLiteral = true;
}
function _List(type, elementType, elements) {
	this.clazz = type;
	this.elementType = elementType;
	this.elements = elements;
	this._isSelfSerialized = true;
}
_List.prototype.getBodyXML = function () {
	s = "";
    for (var i = 0; i < this.elements.length; i ++) {
    	var item = this.elements[i];
		s += "<" + this.elementType + ">";
		s += objectToXMLValue(item);
		s += "</" + this.elementType + ">";
    }

    return s;
};

function _Long(l) {
    return {
        clazz: "java.lang.Long",
        _isSystemLiteral: true,
        text: l
    };
}
function _long(l) {
    return {
        clazz: "long",
        _isSystemLiteral: true,
        text: l
    };
}
function _long_array(numbers) {
	return new _List("long-array", "long", numbers);
}
function _long_list(numbers) {
    return new _List("list", "long", numbers);
}
function _enum(value, clazz) {
    if (value == null) return null;
    return {
        clazz: clazz,
        _isSystemLiteral: true,
        text: value
    }
}
function _date(d) {
    if (d == null) return null;
    return {
        clazz: "date",
        _isSystemLiteral: true,
        text: DateUtil.formatForSystem(d)
    };
}

function pushProgressInfo(info) {

}
function popProgressInfo(info) {

}

var NO_PROGRESS_MESSAGE = "sys:NO_PROGRESS_MESSAGE";
function _invoke(service, entry, args, onCool, onFailed, message) {
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
		//console.log("onreadystatechange: status", request.status);
	    if (request.readyState == 4) {
	    	if (message) showProgress(false);
        	var js = request.responseText;
        	try {
        		if (request.status != 200) {
        		    if (request.status == 401) {
        		        widget.Dialog.error("Your session was expired. Please re-login to the system.", function () {
        		            window.top.location.reload();
        		            return;
        		        });

        		        return;
        		    }
					if (onFailed) onFailed(JSON.parse(js));
					return;
        		}

        		var response = (js == null || js.length == 0) ? null : JSON.parse(js);

        		if (response == null || typeof (response) == "undefined") {
        			onCool(null);
        		} else {
        		    if (response.error) {
        		        if (onFailed) onFailed(response.error);
        		    } else {
                        onCool(response.result);
        		    }
        		}


        	} catch (e) {
                var trace = printStackTrace({e: e});
                console.log('Error!\n' + 'Message: ' + e.message + '\nStack trace:\n' + trace.join('\n'));
        		console.log("Error: message = " + e.message + ", fileName: " + e.fileName + ", lineNumber: " + e.lineNumber);
            	if (onFailed) {
	                onFailed(e);
	            } else {
	            	console.log("request failed: " + service + "." + entry);
	                _handleGenericError(e);
	            }
        	}
	    }
	};

	var argsValues = "";
	if (args != null) {
	   for (var i=0; i < args.length ; i++) {
		var argument = args[i];
	   	var arg = "<vn.evolus.evomed.crm.ajax.ServiceArg>";
		if (argument == undefined) {
			arg += "<name>arg" + i + "</name>";
		} else {
			var classzz = getClazz(argument);
			//console.log("find clazz of arg: "  + argument + ": "+ classzz);
			var valuezz = objectToXMLValue(argument);
		    arg += "<name>arg" + i + "</name>";
		    arg += "<value class=\""+ classzz+ "\">" +  valuezz + "</value>";
		}
		arg += "</vn.evolus.evomed.crm.ajax.ServiceArg>"
		argsValues += arg;
	   }
	}
	var id = "rq" + Math.round(Math.random() * 1000) + (new Date().getTime());
	var xmlObject = {
		"vn.evolus.evomed.crm.ajax.ServiceRequest" : {
			"serviceName" : new _Literal(service),
			"entryName": new _Literal(entry),
			"arguments" : new _Literal(argsValues),
		}
	};

	var xml = objectToXML(xmlObject);
	if (message) showProgress(true, message);

	request.open("POST", API_TRANSPORT_URI, true);
	request.setRequestHeader("Content-type", "application/xml");
	//request.setRequestHeader("Connection", "keep-alive");
	request.setRequestHeader("X-Rio-Client", "JS");
	//console.log("xml:" + xml);
	request.send(xml);
}

function Proxy(name) {
	this._name = name;
}

function getClazz(obj) {
    if (obj == null || typeof(obj) == "undefined") {
        return "";
    }

    if (obj.clazz) {
	  return obj.clazz;
  	}

	if (typeof(obj) == "number") {
		return "int"
	}
    if (typeof(obj) == "object" && obj.slice && obj.push) {
        return "list"
    }
    if (typeof(obj) == "object" && obj.getTime) {
        return "date"
    }
	return typeof(obj);
}


ServiceFactory._cache = {};
ServiceFactory._create = function (service) {
	var config = ServiceFactory._serviceConfigs[service];
	if (!config) throw "No service defined for " + service;

	var proxy = new Proxy(service);
	for (var i = 0; i < config.entries.length; i ++) {
		var entryName = config.entries[i];
		proxy[entryName] = ServiceFactory._createEntryFunction(entryName);
	}

	return proxy;
}
ServiceFactory._createEntryFunction = function (entryName) {
	return function () {
		var args = [];
		var onFailed = null;
		var onCool = null;
		var message = null;

		var lastArgsPos = 0;

		var len = arguments.length;


		//case #1  (..., function onCool() {}, function onFailed() {}, "message");
		//case #1' (..., function onCool() {}, null,                   "message");
		//which means: all extra params are provided
		if (len >= 3
				&& typeof(arguments[len - 3]) == "function"
				&& (arguments[len - 2] == null || typeof(arguments[len - 2]) == "function")
				&& typeof(arguments[len - 1]) == "string") {
			onCool = arguments[len - 3];
			onFailed = arguments[len - 2];
			message = arguments[len - 1];
			lastArgsPos = len - 4;

		//case #2  (..., function onCool() {}, "message");
		//which means: no onFailed is provided
		} else if (len >= 2
				&& (len == 2 || typeof(arguments[len - 3]) != "function")
				&& typeof(arguments[len - 2]) == "function"
				&& typeof(arguments[len - 1]) == "string") {

			onCool = arguments[len - 2];
			message = arguments[len - 1];
			lastArgsPos = len - 3;

		//case #3  (..., function onCool() {}, function onFailed() {});
		//case #3' (..., function onCool() {}, null                  );
		//which means: no message is provided
		} else if (len >= 2
				&& typeof(arguments[len - 2]) == "function"
				&& (arguments[len - 1] == null || typeof(arguments[len - 1]) == "function")) {
			onCool = arguments[len - 2];
			onFailed = arguments[len - 1];
			lastArgsPos = len - 3;

		//case #4  (..., function onCool() {});
		//which means: no onFailed and message are provided
		} else if (len >= 1
				&& (len == 1 || typeof(arguments[len - 2]) != "function")
				&& typeof(arguments[len - 1]) == "function") {

			onCool = arguments[len - 1];
			lastArgsPos = len - 2;
		} else if (len == 0
				|| (len > 0 && typeof(arguments[len - 1]) != "function")) {

			onCool = null;
			lastArgsPos = len - 1;
		} else {
			throw "Invalid invocation sigunature.";
		}

		for (var i = 0; i <= lastArgsPos; i ++) {
			args.push(arguments[i]);
		}
		if (!onFailed) {
		    onFailed = function (e) {
		        if (e && e.message) {
		            widget.Dialog.error(e.message);
		        }
		    };
		}

		return _invoke(this._name, entryName, args, onCool, onFailed, message);
	}
}

ServiceFactory.get = function (service) {
	if (!ServiceFactory._cache[service]) {
		ServiceFactory._cache[service] = ServiceFactory._create(service);
	}

	return ServiceFactory._cache[service];
}

ServiceFactory.toXmlValue = function (object) {
	return objectToXMLValue(object);
}

var Services = {};

ServiceFactory.buildFriendlyServiceNames = function () {
	for (name in ServiceFactory._serviceConfigs) {
		Services[name] = ServiceFactory.get(name);

		var simpleName = name;
		var target = window;
		if (name.match(/^(.+)\.([^\.]+)$/)) {
			var path = RegExp.$1;
			simpleName = RegExp.$2;

			var parts = path.split(/\./);
			for (var i = 0; i < parts.length; i ++) {
				var part = parts[i];
				if (!target[part]) {
					target[part] = {};
				}

				target = target[part];
			}
		}

		target[simpleName] = Services[name];
		window[simpleName] = Services[name];
	}
};
