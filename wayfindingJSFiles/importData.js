/*
Provides functions which are used to perform XMLHTTPRequests.
These are invoked in main.html.
*/

var newline = /\r?\n|\r/;

//used for debugging
var logger = {
	contents : [],
	add : function(msg){
		"use strict";
		this.contents.push(msg);
	},
	displayAll : function(){
		"use strict";
		for(var i = 0; i < this.contents.length; i++){
			console.log(this.contents[i]);
		}
	}
};

// basic http request functions
function get(url, callback){
	// callback is a function with a single parameter,
    // passes in the url's response text as that parameter
	"use strict";
	var req = new XMLHttpRequest();
	req.onreadystatechange = function(){
		if(req.readyState === 4 && req.status === 200){
			logger.add("Response from " + url + ":");
			logger.add(req.responseText);			
			callback(req.responseText);
		}
	};
	req.open("GET", url, true); // true means asynchronous
	req.setRequestHeader("Cache-Control", "max-age=0"); // prevent outdated data
	req.send(null);
}

//works
function sequentialGets(urls, callback){
	//@param urls : an array of strings, the urls to get
	//@param callback : a function which takes an array of strings as a parameter
	//performs a get request for each url, then passes all responses to callback
	"use strict";
	var responses = [];
	var received = 0;
	
	function f(i){
		return function(responseText){
			responses[i] = responseText;
			received++;
			if(received === urls.length){
				callback(responses);
			}
		};
	}
	
	for(var i = 0; i < urls.length; i++){
		responses.push("No response from URL " + urls[i]);
		get(urls[i], f(i));
	}
}