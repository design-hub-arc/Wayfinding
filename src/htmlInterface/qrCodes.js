export function getParamsFromURL() {
	/*
	extracts variables from url.
	defined as ?start=...&end=...&mode=...
	
	returns a Map:
	
	"startID" : int
	"endID"   : int
	"mode"    : string
	
	start and end ids are the ids of the nodes for the 
	start and end points of the default path
	
	mode is what application of wayfinding this is 
	("WAYFINDING", "ARTFINDING", etc)
	*/
	
	const query = window.location.href;
	let values = new Map();
	values.set("startID", 14);
	values.set("endID", 96);
	values.set("mode", "WAYFINDING");
	// defaults to administration to design hub
	
	// check if parameters were passed
	if (query.indexOf("?") > -1) {
		let args = query.split("?")[1];
		let pairs = args.split("&");
		for (let i = 0; i < pairs.length; i++) {
			let pair = pairs[i].split("=");
			console.log("Pair: " + pair);
			
			if(pair[0].toUpperCase().includes("START")){
				values.set("startID", pair[1]);
			} else if (pair[0].toUpperCase().includes("END")){
				values.set("endID", pair[1]);
			} else if(pair[0].toUpperCase().includes("MODE")){
				values.set("mode", pair[1].toUpperCase());
			}
		}
	}
	return values;
}