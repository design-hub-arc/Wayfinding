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
@param fileIds : an array of strings, the ids of files to get


calls driveGet on each id, then resolves the promise, 
passing in all responses to a Map,
where the key is the id, and the value is the response text,
then resolves with that Map once each id's response has been obtained.
*/
export async function driveSeqGets(fileIds){
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
			let only = [];
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
				} else if (data[i].length >= 2 && data[i][1] !== ""){
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


//returns whether or not a file with the given ID exists in the google drive
async function checkExists(id){
	return gapi.client.drive.files.get({
		fileId: id
	}).then(()=>{
		return true;
	}).catch(()=>{
		return false;
	});
}


/*
Returns the id of the most recently added manifest that works.

What it does:
1. Downloads the version log, then temporarily stores its data
2. Checks to see what mode of Wayfinding this is by looking at the URL, defaulting to wayfinding
3. Stores all the URLs in the column headed by that version
4. Starting at the end of URL list, goes backwards until it finds a version that works
5. If no valid manifests exist for the current version, check for the most recent wayfinding manifest.
6. If no valid manifests exist for wayfinding, something went VERY wrong.
*/
async function getLatestManifest(){
	//get the file id, not the URL
	let versionLogId = (VERSION_LOG_URL.indexOf("id=") === -1) ? VERSION_LOG_URL : VERSION_LOG_URL.split("id=")[1];
	
	return new Promise((resolve, reject)=>{
		driveGet(versionLogId).then((responseText)=>{
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
			let id;

			function recursiveCheck(row, col){
				/*
				Remember suffering through recursuion back in CISP 300?
				Yes, it does have valid uses.

				We need to check if an id in the version log works.
				This needs to be done using drive.files.get, which is asynchronus.
				Async + iteration = BAD.
				Instead, make each check call the next check as needed.
				*/
				if(row === 0 && col === 0){
					console.log("No valid manifests exist. Something went very wrong.");
				} else if(row === 0){
					//couldn't find a valid URL in the current column
					console.log("No valid manifests were found for " + rows[row][col] + ". Switching to default wayfinding.");
					recursiveCheck(rows.length - 1, 0);
				} else if(rows[row][col] === ""){
					//skip blank
					recursiveCheck(row - 1, col);
				} else {
					//not blank, not header: we're ready to check.
					url = rows[row][col];
					id = (url.indexOf("id=") === -1) ? url : url.split("id=")[1];
					console.log("Checking " + id);
					checkExists(id).then((doesExist)=>{
						if(doesExist){
							console.log("Yup, that works!");
							resolve(id);
						} else {
							console.log("Nope.");
							recursiveCheck(row - 1, col);
						}
					});
				}
			}

			recursiveCheck(rows.length - 1, mode);
		}).catch((error)=>{
			console.log(error);
		});
	});
}

/*
Imports all the data needed by the program into master
@param master : the Main object used by the program.


*/
export async function importDataInto(master){
	return new Promise((resolve, reject)=>{
		getLatestManifest().then((id)=>{
			console.log("id is " + id);
			importManifest(id).then((responses)=>{
				let nodeDB = master.getNodeDB();
				let canvas = master.getCanvas();

				nodeDB.parseNodeData(responses.get("Node coordinates"));
				nodeDB.parseConnData(responses.get("Node connections"));
				nodeDB.parseNameToId(responses.get("labels"));

				master.notifyImportDone();

				resolve(responses);
			});
		});
	});
}