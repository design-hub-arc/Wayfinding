export function getIDsFromURL() {
	/*
	extracts variables from url.
	defined as ?startID=...&endID=...
	*/
	"use strict";
	const query = window.location.href;
	const values = {startID: 14, endID: 96};

	// check if parameters were passed
	if (query.indexOf("?") > -1) {
		let args = query.split("?")[1];
		let pairs = args.split("&");
		for (let i = 0; i < pairs.length; i++) {
			let pair = pairs[i].split("=");
			console.log("Pair: " + pair);
			values[pair[0]] = parseFloat(pair[1]);
		}
	}
	return [values.startID, values.endID];
}
