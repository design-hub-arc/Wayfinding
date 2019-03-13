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

The program populates two TextBoxes - start and end,
with all of the names in the node database it generates.
Whenever the user clicks the "draw path" button,
the program calls getResult on each of these textboxes,
finds the nodes associated with those names,
and generates a path based off of that.
*/

export class TextBox{
    constructor(textBoxId, resultElementId){
        /*
        @param textBoxId : a string, the id of an <input> HTML element with type="text"
        @param resultElementId : a string, the id of any HTML element whose inner HTML 
        will enter the option closest to the user's input

        if either of the aforementioned elements don't exist, will create them instead
        */
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
		let b = this;
		
		if(!Array.isArray(options)){
			options = [options];
		}
		options.forEach(option =>{
			if(option){
				//make sure option isn't null or undefined
				b.options.push((option.toString().toUpperCase()));
			}
		});
	}
	
	updateResult(){
		// makes the result search for the closest match in options to what the user's entered
		this.resultElement.innerHTML = closestMatch(this.box.value, this.options);
	}
	isValid(){
		//legal input was entered
		//want to make sure the closest match is both in the options, and not the default option
		return (this.options.indexOf(this.resultElement.innerText.toUpperCase()) > 0);
	}
	setInput(str){
		//@param str : a string, what to put in the input box
		//basically makes the program act as the user, typing str in the box
		this.box.value = str;
		this.box.oninput();
	}
	getResult(){
		/*
		@return : a string, the closest match to what the user inputted
		*/
		return this.resultElement.innerText;
	}
};

function matchCount(find, inString){
	/*
	returns the number of characters in find
	that are in inString in order.
	
	Used in closestMatch
	*/
	find = find.toUpperCase();
	inString = inString.toUpperCase();
	let best = 0;
	let spaces = 0;
	
	let matchIdx; //the index in inString of the most recent letter match
	let current;
	let currentSpaces;
	
	// matchCount("string", "stri") whould get a best of 4 on the first run,
	// the next check would be for "tring" in "stri". (offset = 1)
	// would not check with offset = 2, as it could not have more than 4 matches,
	// so cannot be better than the current best of 4
	for(let offset = 0; offset < find.length - best; offset++){
		current = 0; //number of matches in current substring
		currentSpaces = 0;
		matchIdx = 0;
		
		for(let ind = 0; ind < inString.length && offset + current < find.length; ind++){
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

function closestMatch(string, options){
	/*
	REGEX would be an easier way to do this,
	but I'm not sure how much functionality 
	we would be giving up if we switched to
	using that.
	*/
	
	let s = string.trim().toUpperCase();
	let check = [];
	let bestMatches = 0;
	let leastSpaces = string.length;
	let best = options[0];
	
	let count;
	for(let i = 0; i < options.length; i++){
		check.push(options[i].trim().toUpperCase());
		count = matchCount(s, check[i]);
		if(count.matches > bestMatches){
			bestMatches = count.matches;
			leastSpaces = count.spaces;
			best = options[i];
		} else if(count.matches === bestMatches){
			if(count.spaces < leastSpaces){
				bestMatches = count.matches;
				leastSpaces = count.spaces;
				best = options[i];
			}
		}
	}
	
	return best;
}


//WIP
function levenshteinDistance(str1, str2){
	let vector1 = [];
	let vector2 = [];
	let temp;
	let deleteCost;
	let insertCost;
	let changeCost;
	
	for(let i = 0; i < str2.length; i++){
		vector1.push(i);
	}
	for(let i = 0; i < str1.length; i++){
		vector2.push(0);
	}
	
	for(let i = 0; i < str1.length - 1; i++){
		vector2[0] = i + 1;
		
		for(let j = 0; j < str2.length - 1; j++){
			deleteCost = vector1[j + 1] + 1;
			insertCost = vector2[j + 1] + 1;
			changeCost = (str1[i] === str2[j]) ? vector1[j] : vector1[j] + 1;
			
			vector2[j + 1] = Math.min(deleteCost, insertCost, changeCost);
		}
		console.log(vector1);
		console.log(vector2);	
		temp = vector1;
		vector1 = vector2;
		vector2 = temp;
	}
	
	console.log(vector1);
	console.log(vector2);
	
	return vector1[str2.length];
}