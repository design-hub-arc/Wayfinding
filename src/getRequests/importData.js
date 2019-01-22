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
	"use strict";
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
    (b): if only one callback is passed (one element array, or just a function), passes in all responses as an array to that function
    */
    "use strict";
    let responses = [];
    let received = 0;
    let singleFunction = !Array.isArray(callbacks) || callbacks.length === 1;
    
    if(!Array.isArray(callbacks)){
        callbacks = [callbacks]; //make sure it's an array. Can't use singleFunction b/c single element array would cause problems
    }
    
    function finish(){
        if(singleFunction){
            callbacks[0](responses);
        } else {
            for(let i = 0; i < responses.length && i < callbacks.length; i++){
                callbacks[i](responses[i]);
            }
        }
    }
    
    function f(i){
        return function(responseText){
            responses[i] = responseText;
            received++;
            if(received === urls.length){
                finish();
            }
        };
    }

    for(let i = 0; i < urls.length; i++){
        responses.push("No response from URL " + urls[i]);
        get(urls[i], f(i));
    }
}



// improve this
export function importMasterSheet(url, callbacks, ignore = []){
    /*
     * @param url : a string, the 
     * url of the master url file
     * on our google drive
     * 
     * @param callback : a function
     * 
     * This performs a get request on the master url spreadsheet,
     * then performs a get request on each url on the spreadsheet,
     * then passes each URL into the callback function
     * 
     * (improve later)
     */
    
    get(url, responseText => {
        let data = formatResponse(responseText);
        
        let urls = [];
        
        for(let i = 1; i < data.length; i++){ 
            if(data[i][1] !== "" && ignore.indexOf(data[i][0]) === -1){
                urls.push(data[i][1]);
            }
        }
        console.log(urls);
        sequentialGets(urls, callbacks);
    });
}