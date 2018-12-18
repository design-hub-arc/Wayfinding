/*
used to take input from the user

first, accesses or creates two HTML elements,
one used for user input,
the second displays the closest match to what the user entered (see below)

after creating a TextBox, you will need to populate its option by calling...
textBox.addOptions(anArray);

whenever the user types in the text box, 
the result element will search through options for the closest match to what the user entered,
then sets its text to that match.
*/

//@import closestMatch from utilities.js

class TextBox{
    constructor(textBoxId, resultElementId){
        /*
        @param textBoxId : a string, the id of an <input> HTML element with type="text"
        @param resultElementId : a string, the id of any HTML element whose inner HTML 
        will enter the option closest to the user's input

        if either of the aforementioned elements don't exist, will create them instead
        */
        "use strict";
        this.box = document.getElementById(textBoxId);
        this.resultElement = document.getElementById(resultElementId);

        if(this.box === null){
            this.box = document.createElement("input");
            this.box.setAttribute("type", "text");
            this.box.setAttribute("id", textBoxId);
            document.body.appendChild(this.box);
        }
        if(this.resultElement === null){
            this.resultElement = document.createElement("div");
            this.resultElement.setAttribute("id", resultElementId);
            document.body.appendChild(this.resultElement);
        }

        this.options = ["your result will appear here!"];
        this.resultElement.innerHTML = "your result will appear here!";

        this.box.oninput = this.updateResult.bind(this);
    }
	addOptions(options){
		/*
		@param options : an array of strings
		*/
		"use strict";
		var b = this;
		options.forEach(function(option){
			if(option){
				b.options.push((option.toString().toUpperCase()));
			}
		});
	}
	updateResult(){
		// makes the result search for the closest match in options to what the user's entered
		"use strict";
		this.resultElement.innerHTML = closestMatch(this.box.value, this.options);
	}
	isValid(){
		//legal input was entered
		"use strict";
		//want to make sure the closest match is both in the options, and not the default option
		return (this.options.indexOf(this.resultElement.innerHTML.toUpperCase()) > 0);
	}
	setInput(str){
		//@param str : a string, what to put in the input box
		//basically makes the program act as the user, typing str in the box
		"use strict";
		this.box.value = str;
		this.box.oninput();
	}
	getResult(){
		/*
		@return : a string, the closest match to what the user inputted
		*/
		"use strict";
		return this.resultElement.innerHTML;
	}
};

function matchCount(find, inString){
	"use strict";
	/*
	returns the number of characters in find
	that are in inString in order
	*/
	find = find.toUpperCase();
	inString = inString.toUpperCase();
	var best = 0;
	var spaces = 0;
	
	var matchIdx; //the index in inString of the most recent letter match
	var current;
	var currentSpaces;
	
	// matchCount("string", "stri") whould get a best of 4 on the first run,
	// the next check would be for "tring" in "stri". (offset = 1)
	// would not check with offset = 2, as it could not have more than 4 matches,
	// so cannot be better than the current best of 4
	for(var offset = 0; offset < find.length - best; offset++){
		current = 0; //number of matches in current substring
		currentSpaces = 0;
		matchIdx = 0;
		
		for(var ind = 0; ind < inString.length && offset + current < find.length; ind++){
			//find[offset + current] will check the second character of the find substring after finding one match
			//guarantees that the letters are in order
			if(find[offset + current] === inString[ind]){
				current++;
				
				if(current > 1){
					currentSpaces += ind - matchIdx - 1;
				} else {
					currentSpaces += ind;
				}
				matchIdx = ind;
			}
		}
		if(current > best){
			best = current;
			spaces = currentSpaces;
		}
	}
	
	return {"matches" : best, "spaces" : spaces};
}

function closestMatchIndex(string, options){
	"use strict";
	var s = string.trim().toUpperCase();
	var check = [];
	var best = 0;
	var leastSpaces = string.length;
	var idxOfBest = 0;
	
	var count;
	for(var i = 0; i < options.length; i++){
		check.push(options[i].trim().toUpperCase());
		count = matchCount(s, check[i]);
		if(count.matches > best){
			best = count.matches;
			leastSpaces = count.spaces;
			idxOfBest = i;
		} else if(count.matches === best){
			if(count.spaces < leastSpaces){
				best = count.matches;
				leastSpaces = count.spaces;
				idxOfBest = i;
			}
		}
	}
	
	return idxOfBest;
}

function closestMatch(s, options){
	// returns the string in options which most closely resembles s
	"use strict";
	return options[closestMatchIndex(s, options)];
}