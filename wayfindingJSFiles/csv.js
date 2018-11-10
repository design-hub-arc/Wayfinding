/*
Provides the CsvFile class

The CsvFile class is used to format imported data from spreadsheets to a format usable by the program.
*/

var newline = /\r?\n|\r/;

function removeQuotes(s){
	/*
	@param s : a string, what you want to remove quote marks from
	@return a string, the original string sans quotes
	
	This is used to remove the quote marks
	around spreadsheet cells containing multiple
	values after the sheet is converted to a csv file
	returns the string, DOES NOT MODIFY PARAMETER 
	
	Example:
		removeQuotes("Testing 'text'");
		-> "Testing text"
	*/
	"use strict";
	var ret = s;
	while(ret.indexOf('"') !== -1){
		ret = ret.replace('"', '');
	}
	while(ret.indexOf("'") !== -1){
		ret = ret.replace("'", '');
	}
	return ret;
}

function formatString(s){
	/* 
	@param s : a string, the string to format
	@return an array of strings, made by 
	removing quote marks from the original string, replacing them with [ and ],
	then splitting on commas
	
	Example:
		formatString("a, b, c, 'd, e'");
		-> ["a", "b", "c", ["d", "e"]]
	*/
	"use strict";
	var ret = [];
	var inQuotes = false;
	var endQuotes = false; // the current index had a quote mark
	var arrayIndex = -1;
	var split = s.split(",");
	for(var i = 0; i < split.length; i++){
		split[i] = split[i].trim();
		endQuotes = false;	
		if(split[i][0] === '"' || split[i][0] === "'"){
			// if the first character is a quote mark, start the array
			inQuotes = true;
			ret.push([]);
			arrayIndex = ret.length - 1;
			split[i] = removeQuotes(split[i]);
		} else if (split[i][split[i].length - 1] === '"' || split[i][split[i].length - 1] === "'"){
			// if quote mark at end, end the array
			inQuotes = false;
			endQuotes = true;
			split[i] = removeQuotes(split[i]);
		}
		
		//now, add to the array
		if(inQuotes || endQuotes){
			ret[arrayIndex].push(split[i]);
		} else {
			ret.push(split[i]);
		}
	}
	return ret;
}

function formatResponse(responseText){
	"use strict";
	var ret = [];
	var splitOnLine = responseText.split(newline);
	
	splitOnLine.forEach(function(line){
		ret = ret.concat(expand(formatString(line)));
	});
	
	return ret;
}

function expand(array){
	/*
    @param array : an array that we want to expand
	@return an array : each of the rows resulting from array expansion
	
    each element in data can be any type; the program automatically deals with arrays and objects   
    expands the data so that none of its columns are arrays
	
	EXPANDING EXAMPLE:
        this is a row
        [
           [a, b],
		    c,
           [d, e, f]
        ]

        would get changed to:
        this is 6 rows
        [
            [a, c, d],
            [a, c, e],
            [a, c, f],
            [b, c, d],
            [b, c, e],
            [b, c, f]
        ]
    */
    "use strict";
	//first, declare variables
	var newData = [];
	var rows = 1; //the number of rows that will be returned
	var data = (Array.isArray(array) ? array : [array]); //doesn't need to be copy
	var period = 1; //how many times the current pattern will repeat
    var spaceInPeriod; //how many elements are in the current period
    var times; //how many times each element in the current column will appear in each period
	var timesThusFar; //how many times the pattern has occured so far
	var numInPattern; //what index of the repeated pattern are we on?
	
	data = data.map(function(col){
        return (Array.isArray(col) ? col : [col]); //convert every column to an array
    });
	data.forEach(function(col){
        rows *= col.length;
    });
	//populate newData so that we can access its indexes
    for(var i = 0; i < rows; i++){
        newData.push([]);
		for(var j = 0; j < data.length; j++){
			newData[i].push(0);
		}
	}

	/*
	OK, so this is a little bit complicated.

	now, whenever we get multiple elements in one 'column' from the data we are given,
	that splits the resulting rows into pieces equal to the number of items in that column.
	In the above example, column 0 contains 2 elements, so the result is split evenly into 2 pieces:
	the first piece contains rows that all begin with 'a', whereas the second each begin with 'b'.
	This split means that we have to make the pattern of future columns repeat; 
	for example, column 2 contains 3 values: d, e, and f. Since the 0th column was split in 2,
	it results in the pattern d, e, f, d, e, f instead of d, d, e, e, f, f
	*/
	
	//iterate through each column of data
	//since data represents one row of data, each index is a column
	//somewhat counterintuitive, I know
	for(var col = 0; col < data.length; col++){
		spaceInPeriod = rows / period; //each period will store an equal amount of data, thus, the we need to divvy the spaces out evenly amongst them
		times = spaceInPeriod / data[col].length; //the current column's pattern will repeat until it fills the rows, so we need to find how many times it will repeat
		
		//next, go through each row of newData
		for(var row = 0; row < rows; row++){
			timesThusFar = parseInt(row / times); //how many of 'times' are in 'row'? that is how many times we've gone through a pattern
			numInPattern = timesThusFar % data[col].length; //what index of the current column in data we are on
			newData[row][col] = data[col][numInPattern];
		}
		period *= data[col].length;
	}
    
	//lastly, return the data
	
	if(newData.length > 1){
		console.log(array);
	}
	
    return newData;
}



function CsvFile(text){
    /*
    @param text : a String, the response text from an HTTP request
    */
	"use strict";
    this.headers = [];
    this.data = formatResponse(text);
    /*
    var splitOnLine = text.split(newline);
    for(var i = 0; i < splitOnLine.length; i++){
        this.addLine(splitOnLine[i]);
    }*/
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
	},
	addLine : function(newline){
		/*
		@param newline : a string, the line of a csv file we want to format, 
		then add to this' data
		*/
        "use strict";
        this.data = this.data.concat(expand(formatString(newline)));
    }
};