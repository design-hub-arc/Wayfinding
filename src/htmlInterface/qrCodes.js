export function getIDsFromURL() {
	/*
	extracts variables from url.
	defined as ?start=...&end=...
	*/
	"use strict";
	const query = window.location.href;
	const values = [14, 96];

	// check if parameters were passed
	if (query.indexOf("?") > -1) {
		let args = query.split("?")[1];
		let pairs = args.split("&");
		for (let i = 0; i < pairs.length; i++) {
			let pair = pairs[i].split("=");
			console.log("Pair: " + pair);
			
			if(pair[0].toUpperCase().includes("START")){
				values[0] = pair[1];
			} else if (pair[0].toUpperCase().includes("END")){
				values[1] = pair[1];
			}
			
			values[pair[0]] = parseFloat(pair[1]);
		}
	}
	return values;
}
