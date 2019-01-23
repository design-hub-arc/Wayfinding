/*
Provides the CsvFile class

The CsvFile class is used to format imported data from spreadsheets to a format usable by the program.

 Since Matt will be developing an app to manage the data used by the program, 
 we may get rid of this later,
 as then it will always be in exactly the format we want.
 */

export function formatResponse(responseText){
	"use strict";
	let ret = [];
	try{
		let splitOnLine = responseText.split(/\r?\n|\r/); //split on newline
	
		splitOnLine.forEach(line => ret.push(line.split(",")));
	} catch(e){
		console.log(e.stack);
		console.log("response text is: ");
		console.log(responseText);
	}
	
	return ret;
}

export class CsvFile{
    constructor(text){
        /*
        @param text : a String, the response text from an HTTP request
        */
        "use strict";
        this.headers = [];
        this.data = formatResponse(text);

        this.headers = this.data[0].map(header => header.toUpperCase());
    }
	getNonHeaders(){
		/*
		@return an array of arrays of strings, each row of this' data, sans the first, which is headers
		*/
		"use strict";
		return this.data.slice(1, this.data.length);
	}
	indexOfCol(possibleHeaders){
		/*
		@param possibleHeaders : an array of strings, possible names of the header we're searching for
		@return an int : the index of one of this' headers contained in possibleHeaders
		if none of the headers in possibleHeaders exists in this' headers, returns -1
		*/
		"use strict";
		let ret = -1;
		
		if(!Array.isArray(possibleHeaders)){
			possibleHeaders = [possibleHeaders];
		}
		possibleHeaders = possibleHeaders.map(header => header.toUpperCase());
		
		for(let i = 0; i < this.headers.length && ret === -1; i++){
			if(possibleHeaders.indexOf(this.headers[i]) !== -1){
				ret = i;
			}
		}
		return ret;
	}
};