/*
Provides functions which are used to perform get requests.
These are invoked in the html files.
*/

import {formatResponse, CsvFile} from "../dataFormatting/csv.js";



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

// basic http request functions
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


export async function importWayfinding(url, nodeDB){
	/*
	imports all of the data needed for wayfinding into the program
	
	nodeDB will be populated by the data downloaded
	*/
	return new Promise((resolve, reject) => {
		importMasterSheet(url, {
			ignore: ["map image", "classes", "class to room"]
		}).then((responses) => {
			nodeDB.parseNodeData(responses.get("Node coordinates"));
			nodeDB.parseConnData(responses.get("Node connections"));
			nodeDB.parseNameToId(responses.get("buildings"));
			nodeDB.parseNameToId(responses.get("rooms"));
			nodeDB.parseImageResponse(new CsvFile(responses.get("images")));
			//nodDB.parseClassResponse(new CsvFile(responses.get("class to room")));
			resolve(responses);
		});
	});
	
}

export async function importArtfinding(url, nodeDB){
	return new Promise((resolve, reject) => {
		importMasterSheet(url).then((responses) => {
			nodeDB.parseNameToId(responses.get("labels"));
			resolve(responses);
		},
		{
			only: ["labels"]
		});
	});
}