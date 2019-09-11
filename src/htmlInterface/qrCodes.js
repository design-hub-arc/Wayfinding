/*
 *
 */



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
    values.set("startName", "");
    values.set("endName", "");
	values.set("mode", "WAYFINDING");
	values.set("dev", false);
	// defaults to administration to design hub
	
	// check if parameters were passed
	if (query.indexOf("?") > -1) {
		let args = query.split("?")[1];
		let pairs = args.split("&");
		for (let i = 0; i < pairs.length; i++) {
			let pair = pairs[i].split("=");
			
			if(pair[0].toUpperCase().includes("START")){
				//is either a name or an ID
                let intVal = Number.parseInt(pair[1]);
                if(Number.isNaN(intVal)){
                    //is name, not ID
                    values.set("startName", pair[1]);
                } else {
                    values.set("startID", intVal);
                }
			} else if (pair[0].toUpperCase().includes("END")){
				values.set("endID", pair[1]);
			} else if(pair[0].toUpperCase().includes("MODE")){
				values.set("mode", pair[1].toUpperCase());
			} else if(pair[0].toUpperCase().includes("DEV")){
				values.set("dev", true);
			}
		}
	}
    console.log(values);
    console.log(new QrCodeParams());
	return values;
}

/*
 * Newer version of the object returned from getParamsFromURL.
 */
export class QrCodeParams{
    constructor(){
        /*
        extracts variables from url.
        defined as ?start=...&end=...&mode=...

        "startID" : int
        "endID"   : int
        "mode"    : string

        start and end ids are the ids of the nodes for the 
        start and end points of the default path

        mode is what application of wayfinding this is 
        ("WAYFINDING", "ARTFINDING", etc)
        */

        const query = window.location.href;
        // defaults to administration to design hub
        this.start = 14;
        this.end = 96;
        this.startMode = QrCodeParams.ID_MODE;
        this.endMode = QrCodeParams.ID_MODE;
        this.wayfindingMode = "WAYFINDING"; //cannot be enum, as mode is an arbitrary name on the column of the version log
        this.devMode = false;
        
        
        // check if parameters were passed
        if (query.indexOf("?") > -1) {
            let args = query.split("?")[1];
            let pairs = args.split("&");
            pairs.forEach((pair)=>{
                pair = pair.split("=");
                pair[0] = pair[0].toUpperCase();
                //console.log(pair[0] + ": " + pair[1]);
                if(pair[0].includes("MODE")){
                    this.wayfindingMode = pair[1].toUpperCase();
                } else if(pair[0].includes("START")){
                    //is either a name or an ID
                    let intVal = Number.parseInt(pair[1]);
                    if(Number.isNaN(intVal)){
                        //is name, not ID
                        this.start = pair[1];
                        this.startMode = QrCodeParams.NAME_MODE;
                    } else {
                        this.start = intVal;
                        this.startMode = QrCodeParams.ID_MODE;
                    }
                } else if(pair[0].includes("END")){
                    let intVal = Number.parseInt(pair[1]);
                    if(Number.isNaN(intVal)){
                        //is name, not ID
                        this.end = pair[1];
                        this.endMode = QrCodeParams.NAME_MODE;
                    } else {
                        this.end = intVal;
                        this.endMode = QrCodeParams.ID_MODE;
                    }
                } else if(pair[0].includes("DEV") && pair[1].toUpperCase() === "TRUE"){
                    this.devMode = true;
                    //note: not logically = to this.devMode = ~~~
                }
            });
        }
        
        function displayData(){
            console.log("QR code parameters:");
            console.log(`* Start is ${this.start} (${(this.startMode === 0) ? "ID" : "name"})`);
            console.log(`* End is ${this.end} (${(this.endMode === 0) ? "ID" : "name"})`);
            console.log(`* Wayfinding Mode is ${this.wayfindingMode}`);
            console.log(`* Developer mode is ${(this.devMode) ? "on" : "off"}`);
        }
    }
}
QrCodeParams.ID_MODE = 0;
QrCodeParams.NAME_MODE = 1;