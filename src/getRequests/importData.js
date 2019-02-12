/*
Provides functions which are used to perform XMLHTTPRequests.
These are invoked in the html files.
*/

import {formatResponse} from "../dataFormatting/csv.js";



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
export function get(url, callback){
	// callback is a function with a single parameter,
    // passes in the url's response text as that parameter
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
	
}

export function sequentialGets(urls, callbacks){
    /*
    @param urls : an array of strings, the urls to get
    @param callbacks : either...
    (a): an array of functions, each taking a string as a paramter
    (b): a single element array or function, taking an array of strings as a parameter

    performs a get request on each url, then...
    (a): if multiple callbacks are provided, passes in responses[i] to callback[i]
    (b): if only one callback is passed (one element array, or just a function), passes in all responses as an Map to that function,
		where the key is the URL, and the value is the response text
    */
    "use strict";
    let responses = new Map();
    let received = 0;
    let singleFunction = !Array.isArray(callbacks) || callbacks.length === 1;
    
    if(!Array.isArray(callbacks)){
        callbacks = [callbacks]; //make sure it's an array. Can't use singleFunction b/c single element array would cause problems
    }
    
    function finish(){
        if(singleFunction){
            callbacks[0](responses);
        } else {
			let respArray = Array.from(responses.values()); // Maps retain insertion order, so this works
            for(let i = 0; i < respArray.length && i < callbacks.length; i++){
                callbacks[i](respArray[i]);
            }
        }
    }
    
    function f(url){
        return function(responseText){
            responses.set(url, responseText);
            received++;
            if(received === urls.length){
                finish();
            }
        };
    }

    for(let i = 0; i < urls.length; i++){
        responses.set(urls[i], "No response from URL " + urls[i]);
        get(urls[i], f(urls[i]));
    }
}


export function importMasterSheet(url, callback, options={}){
    /*
	 @param url : a string, the 
	 url of the master url file
	 on our google drive

	 @param callback : a function

	 This performs a get request on the master url spreadsheet,
	 then performs a get request on each url on the spreadsheet,
	 then passes each URL into the callback function

	 passes a Map, 
	 with the keys being the identifier in the first column of the spreadsheet,
	 and the value is the response text from performing a get request on the url after that identifier;
	 into the callback
     */
    
    get(url, responseText => {
        let data = formatResponse(responseText);
        
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
            if(data[i][1] !== "" && ignore.indexOf(data[i][0]) === -1){
				/*
				The data is a table, with the first column being a key,
				such as "node coordinates", "buildings", etc,
				
				and the second being the url linking to that resource
				*/
				urlToKey.set(data[i][1], data[i][0]);
            }
        }
		
		function reformat(responses){
			/*
			Convets the url-to-response result of seqGet
			to an easier to use key-to-response
			*/
			let ret = new Map();
			
			responses.forEach((responseText, url) => {
				ret.set(urlToKey.get(url), responseText);
			});
			
			callback(ret);
		}
		
        sequentialGets(Array.from(urlToKey.keys()), reformat);
    });
}

export async function importWayfinding(url, nodeDB){
	/*
	imports all of the data needed for wayfinding into the program
	
	nodeDB will be populated by the data downloaded
	*/
	return new Promise((resolve, reject) => {
		importMasterSheet(url, (responses) => {
			nodeDB.parseNodeData(responses.get("Node coordinates"));
			nodeDB.parseConnData(responses.get("Node connections"));
			nodeDB.parseNameToId(responses.get("buildings"));
			nodeDB.parseNameToId(responses.get("rooms"));
			
			resolve(responses);
		},
		{
			ignore: ["map image", "classes", "class to room"]
		});
	});
	
}

export function importArtfinding(){
	
}