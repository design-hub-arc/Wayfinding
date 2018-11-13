/*
Provides the CsvFile class

The CsvFile class is used to format imported data from spreadsheets to a format usable by the program.
*/

function formatResponse(responseText){
	"use strict";
	var ret = [];
	var splitOnLine = responseText.split(/\r?\n|\r/); //split on newline
	
	splitOnLine.forEach(function(line){
		ret.push(line.split(","));
	});
	
	return ret;
}

function CsvFile(text){
    /*
    @param text : a String, the response text from an HTTP request
    */
	"use strict";
    this.headers = [];
    this.data = formatResponse(text);
    
    this.headers = this.data[0].map(function(header){
		return header.toUpperCase();
	});
}
CsvFile.prototype = {
	getNonHeaders : function(){
		/*
		@return an array of arrays of strings, each row of this' data, sans the first, which is headers
		*/
		"use strict";
		return this.data.slice(1, this.data.length);
	},
	indexOfCol : function(possibleHeaders){
		/*
		@param possibleHeaders : an array of strings, possible names of the header we're searching for
		@return an int : the index of one of this' headers contained in possibleHeaders
		if none of the headers in possibleHeaders exists in this' headers, returns -1
		*/
		"use strict";
		var ret = -1;
		
		if(!Array.isArray(possibleHeaders)){
			possibleHeaders = [possibleHeaders];
		}
		possibleHeaders = possibleHeaders.map(function(header){
			return header.toUpperCase();
		});
		
		for(var i = 0; i < this.headers.length && ret === -1; i++){
			if(possibleHeaders.indexOf(this.headers[i]) !== -1){
				ret = i;
			}
		}
		return ret;
	}
};