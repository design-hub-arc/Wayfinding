function getIDsFromURL() {
	/*
	extracts variables from url.
	defined as ?startID=...&endID=...
	*/
	"use strict";
	var query = window.location.href;
	var values = {startID: 14, endID: 96};

	// check if parameters were passed
	if (query.indexOf("?") > -1) {
		var args = query.split("?")[1];
		var pairs = args.split("&");
		for (var i = 0; i < pairs.length; i++) {
			var pair = pairs[i].split("=");
			console.log("Pair: " + pair);
			values[pair[0]] = parseFloat(pair[1]);
		}
	}
	return [values.startID, values.endID];
}
