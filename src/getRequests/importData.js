/*
Provides functions which are used to perform get requests.
These are invoked in the html files.
*/

import {formatResponse, CsvFile} from "../dataFormatting/csv.js";
import {VERSION_LOG_URL}         from "./urls.js";
import {getParamsFromURL}        from "../htmlInterface/qrCodes.js";


export const newline = /\r?\n|\r/;

//used for debugging
export const logger = {
	contents : [],
	add(msg){
		"use strict";
		this.contents.push(msg);
	},
	displayAll(){
		"use strict";
		for(let i = 0; i < this.contents.length; i++){
			console.log(this.contents[i]);
		}
	}
};


/*
**********************************************************************************************
using regular get requests
**********************************************************************************************
*/
// can I get rid of these?
export async function get(url){
    // passes in the url's response text as that parameter to the promise.resolve
	/*
	let req = new XMLHttpRequest();
	req.onreadystatechange = function(){
		if(req.readyState === 4 && req.status === 200){
			logger.add("Response from " + url + ":");
			logger.add(req.responseText);			
			callback(req.responseText);
		}
	};
    req.onerror = function(e){
        console.log(e);
        callback("");
    };

    req.open("GET", url, true); // true means asynchronous
    req.setRequestHeader("Cache-Control", "max-age=0"); // prevent outdated data
    req.send(null);
	*/
	
	
	return fetch(url).then((response) => {
		let text = response.text();
		logger.add("Response from " + url + ":");
		logger.add(response);
		logger.add(text);
		return text;
	});
}

export async function sequentialGets(urls){
    /*
    @param urls : an array of strings, the urls to get
    
    performs a get request on each url, then resolves the promise, 
	passing in all responses as an Map to that function,
	where the key is the URL, and the value is the response text
    */
	return new Promise((resolve, reject) => {
		let responses = new Map();
		let received = 0;
		
		for(let i = 0; i < urls.length; i++){
			responses.set(urls[i], "No response from URL " + urls[i]);
			get(urls[i]).then((responseText) => {
				responses.set(urls[i], responseText);
				received++;
				if(received === urls.length){
					resolve(responses);
				}
			});
		}
	});
}

export async function importMasterSheet(url, options={}){
	/*
	 @param url : a string, the 
	 url of the master url file
	 on our google drive


	 This performs a get request on the master url spreadsheet,
	 then performs a get request on each url on the spreadsheet,
	 then passes each URL into the callback function

	 passes a Map, 
	 with the keys being the identifier in the first column of the spreadsheet,
	 and the value is the response text from performing a get request on the url after that identifier
	 returning the Map
     */
	let promise = new Promise((resolve, reject) => {
		get(url).then((responseText) => {
			let data = formatResponse(responseText);
			let only = (options.hasOwnProperty("only")) ? options["only"] : [];
			let ignore = (options.hasOwnProperty("ignore")) ? options["ignore"] : [];
			let urlToKey = new Map();
			/*
			since sequentialGets will return url-to-response,
			we need to provide an easier way to identify what each response is giving.
			since we are looking at key-to-url-to-response text,
			and sequentialGets gives us url-to-response,
			we can use this to get key-to-response text
			*/

			for(let i = 1; i < data.length; i++){ 
				if(only.length > 0){
					if(data[i][1] !== "" && only.indexOf(data[i][0]) !== -1){
						urlToKey.set(data[i][1], data[i][0]);
					}
				} else if (data[i][1] !== "" && ignore.indexOf(data[i][0]) === -1){
					/*
					The data is a table, with the first column being a key,
					such as "node coordinates", "buildings", etc,

					and the second being the url linking to that resource
					*/
					urlToKey.set(data[i][1], data[i][0]);
				}
			}

			sequentialGets(Array.from(urlToKey.keys())).then((responses) => {
				/*
				Convets the url-to-response result of seqGet
				to an easier to use key-to-response
				*/
				
				let ret = new Map();
				
				responses.forEach((responseText, url) => {
					ret.set(urlToKey.get(url), responseText);
				});

				resolve(ret);
			});
		});
	});
	return promise;
}


export async function importWayfinding(url, master){
	/*
	imports all of the data needed for wayfinding into the program
	
	master is a Main object which will be populated by the imported data
	*/
	return new Promise((resolve, reject) => {
		importMasterSheet(url, {
			ignore: ["map image", "classes", "class to room"]
		}).then((responses) => {
			let nodeDB = master.getNodeDB();
			let canvas = master.getCanvas();
			
			nodeDB.parseNodeData(responses.get("Node coordinates"));
			nodeDB.parseConnData(responses.get("Node connections"));
			nodeDB.parseNameToId(responses.get("buildings"));
			nodeDB.parseNameToId(responses.get("rooms"));
			nodeDB.parseImageResponse(new CsvFile(responses.get("images")));
			//nodDB.parseClassResponse(new CsvFile(responses.get("class to room")));
			
			master.notifyImportDone();
			
			resolve(responses);
		});
	});
	
}

export async function importArtfinding(url, master){
	return new Promise((resolve, reject) => {
		importMasterSheet(url, {
			only: ["labels"]
		}).then((responses) => {
			master.getNodeDB().parseNameToId(responses.get("labels"));
			master.notifyImportDone();
			resolve(responses);
		});
	});
}




/*
**********************************************************************************************
using google drive
**********************************************************************************************
*/
/*
Gets a file's data from the google drive.
fileId - a string, the id of the file in google drive.
*/
export async function driveGet(fileId){
	//gapi is defined in https://apis.google.com/js/api.js.
	//if this doesn't work, make sure that the API has been loaded!
	return gapi.client.drive.files.get({
		fileId: fileId,
		alt: "media" //this means download the file's contents, not its metadata
	}).then((result)=> {
		logger.add("Response from " + fileId + ":");
		logger.add(result);
		logger.add(result.body);
		return result.body;
	}).catch((error)=>{
		throw new Error(error);
	});
}

/*
*/
export async function driveSeqGets(fileIds){
	/*
    @param fileIds : an array of strings, the ids of files to get
    
    performs a get request on each id, then resolves the promise, 
	passing in all responses as an Map to that function,
	where the key is the id, and the value is the response text
    */
	return new Promise((resolve, reject) => {
		let responses = new Map();
		let received = 0;
		
		for(let i = 0; i < fileIds.length; i++){
			responses.set(fileIds[i], "No response from file ID " + fileIds[i]);
			driveGet(fileIds[i]).then((responseText) => {
				responses.set(fileIds[i], responseText);
				received++;
				if(received === fileIds.length){
					resolve(responses);
				}
			});
		}
	});
}
export async function importManifest(fileId, options={}){
	/*
	 @param fileId : a string, the 
	 id of the master url file
	 on our google drive


	 This performs a get request on the master url spreadsheet,
	 then performs a get request on each url on the spreadsheet,
	 then passes each URL into the callback function

	 passes a Map, 
	 with the keys being the identifier in the first column of the spreadsheet,
	 and the value is the response text from performing a get request on the url after that identifier
	 returning the Map
     */
	let promise = new Promise((resolve, reject) => {
		driveGet(fileId).then((responseText) => {
			let data = formatResponse(responseText);
			let only = (options.hasOwnProperty("only")) ? options["only"] : [];
			let ignore = (options.hasOwnProperty("ignore")) ? options["ignore"] : [];
			let fileIdToKey = new Map();
			/*
			since sequentialGets will return fileId-to-response,
			we need to provide an easier way to identify what each response is giving.
			since we are looking at key-to-fileId-to-response text,
			and sequentialGets gives us fileId-to-response,
			we can use this to get key-to-response text
			*/
            console.log(data);

			for(let i = 1; i < data.length; i++){ 
				if(only.length > 0){
					if(data[i].length >= 2 && data[i][1] !== "" && only.indexOf(data[i][0]) !== -1){
						if(data[i][1].indexOf("id=") > -1){
                            fileIdToKey.set(data[i][1].split("id=")[1], data[i][0]);
                        } else {
                            fileIdToKey.set(data[i][1], data[i][0]);
                        }
					}
				} else if (data[i].length >= 2 && data[i][1] !== "" && ignore.indexOf(data[i][0]) === -1){
					/*
					The data is a table, with the first column being a key,
					such as "node coordinates", "buildings", etc,

					and the second being the url linking to that resource
					*/
					if(data[i][1].indexOf("id=") > -1){
                        fileIdToKey.set(data[i][1].split("id=")[1], data[i][0]);
                    } else {
                        fileIdToKey.set(data[i][1], data[i][0]);
                    }
				}
			}
            
            
			driveSeqGets(Array.from(fileIdToKey.keys())).then((responses) => {
				/*
				Convets the url-to-response result of seqGet
				to an easier to use key-to-response
				*/
				
				let ret = new Map();
				
				responses.forEach((responseText, url) => {
					ret.set(fileIdToKey.get(url), responseText);
				});

				resolve(ret);
			});
		});
	});
	return promise;
}

/*
imports all of the data needed for wayfinding into the program

master is a Main object which will be populated by the imported data
*/
export async function importWayfindingDrive(fileId, master){
	return new Promise((resolve, reject) => {
		importManifest(fileId, {
			ignore: ["map image", "classes", "class to room"]
		}).then((responses) => {
			let nodeDB = master.getNodeDB();
			let canvas = master.getCanvas();
			
			nodeDB.parseNodeData(responses.get("Node coordinates"));
			nodeDB.parseConnData(responses.get("Node connections"));
			nodeDB.parseNameToId(responses.get("labels"));
			
			master.notifyImportDone();
			
			resolve(responses);
		});
	});
	
}

export async function importArtfindingDrive(fileId, master){
	return new Promise((resolve, reject) => {
		importManifest(fileId, {
			only: ["labels"]
		}).then((responses) => {
			master.getNodeDB().parseNameToId(responses.get("labels"));
			master.notifyImportDone();
			resolve(responses);
		});
	});
}




async function checkExists(id){
	return gapi.client.drive.files.get({
		fileId: id
	}).then(()=>{
		console.log("exist: " + id);
		return true;
	}).catch(()=>{
		console.log("not exist: " + id);
		return false;
	});
}
/*
Imports all the data needed by the program into master
@param master : the Main object used by the program.

What it does:
1. Downloads the version log, then temporarily stores its data
2. Checks to see what mode of Wayfinding this is by looking at the URL, defaulting to wayfinding
3. Stores all the URLs in the column headed by that version
4. Starting at the end of URL list, goes backwards until it finds a version that works
*/
export async function importDataInto(master){
	//get the file id, not the URL
	let id = (VERSION_LOG_URL.indexOf("id=") === -1) ? VERSION_LOG_URL : VERSION_LOG_URL.split("id=")[1];
	driveGet(id).then((responseText)=>{
		//get the contents of the version log
		let rows = responseText.split(newline);
		rows = rows.map((row)=>{
			return row.split(",");
		});
		
		//since getParamsFromURL converts to upper case, we need the headers to be uppercase as well
		rows[0] = rows[0].map((header)=>header.toUpperCase());
		
		//check the wayfinding mode
		//mode is an int, the index of the column it is contained in the version log
		let mode = rows[0].indexOf(getParamsFromURL().get("mode"));
		if(mode === -1){
			/*
			The mode is not present in the version log,
			so default to wayfinding.
			*/
			mode = 0;
		}
		
		//keep goind until you hit a version that works
		let url;
		let found = false;
		
		
		
		/*
		this will need to be recursive.
		since checkexists is async, 
		I need to make this wait to check the next url
		until after it knows it works or doesnt
		*/
		for(let i = rows.length - 1; i > 0 && !found; i--){
			url = rows[i][mode];
			console.log(url);
			if(url === ""){
				//skip blanks
				continue;
			}
			
			id = (url.indexOf("id=") === -1) ? url : url.split("id=")[1];
			// now we use the url as the file url
			
			
			//check if the file exists
			checkExists(id).then((doesExist)=>{
				if(doesExist){
					found = true;
				} else {
					//make this call the next instead of loop
					if(i === 1 && mode != 0){
						//on last URL, still none valid, so switch to wayfinding
						alert("No valid manifests were found for " + rows[0][mode] + ". Switching to Wayfinding");
						i = rows.length; //will automatically subtract 1 at the end of the loop
						mode = 0;
					}
				}
			});
		}	
	}).catch((error)=>{
		console.log(error);
	});
}