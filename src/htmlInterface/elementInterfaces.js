/* 
 * This file contains all the classes that are used to interact with HTML elements.
 * 
 * Upon changing the index.html file, you will likely need to change this one.
 */

/*
 * The TextBox class is an input box, followed by a display element.
 * The TextBox has a series of options, which are the only values it can return.
 * When the user types in the input box,
 * the display element will update to display the option it contains which most closely matches the input.
 */
class TextBox{
    /*
     * @param inputBoxId: a string, the id of an <input> HTML element with type="text"
     * @param resultDisplayId: a string, the id of an HTML element which will display the closest match to user input
     */
    constructor(inputBoxId, resultDisplayId){
        if(inputBoxId.startsWith("#")){
            inputBoxId = inputBoxId.substring(1);
        }
        if(resultDisplayId.startsWith("#")){
            resultDisplayId = resultDisplayId.substring(1);
        }
        this.box = document.getElementById(inputBoxId);
        this.resultElement = document.getElementById(resultDisplayId);
        if(this.box === null){
            throw new Error("(parameter 1) Cannot find HTML element with ID " + inputBoxId);
        }
        if(this.resultElement === null){
            throw new Error("(parameter 2) Cannot find HTML element with ID " + resultDisplayId);
        }
        this.options = ["Your result will appear here!"];
        this.resultElement.innerHTML = this.options[0];
        this.box.oninput = this.updateResult.bind(this);
    }
    
    /*
     * @param options: an array of strings, or just a single string. The options to add.
     */
    addOptions(options){
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


//https://en.wikipedia.org/wiki/Levenshtein_distance
function levenshteinDistance(str1, str2, ignoreCase, debug=false){
    let len1 = str1.length;
    let len2 = str2.length;
    let grid = [];
    let deleteCost;
	let insertCost;
	let changeCost;
    
    if(ignoreCase){
        str1 = str1.toUpperCase();
        str2 = str2.toUpperCase();
    }
    
    for(let y = 0; y < len2 + 1; y++){
        grid.push([]);
        for(let x = 0; x < len1 + 1; x++){
            grid[y].push(0);
        }
    }
    
    //fill in the first row and column
    //you need to delete x characters to convert a string of length x to ""
    for(let y = 0; y < len2 + 1; y++){
        grid[y][0] = y;
    }
    for(let x = 0; x < len1 + 1; x++){
        grid[0][x] = x;
    }
    
    //go through the rest
    for(let y = 1; y < len2 + 1; y++){
        for(let x = 1; x < len1 + 1; x++){
            deleteCost = grid[y - 1][x] + 1;
			insertCost = grid[y][x - 1] + 1;
			changeCost = grid[y - 1][x - 1] + ((str1[x - 1] === str2[y - 1]) ? 0 : 1);
            grid[y][x] = Math.min(deleteCost, insertCost, changeCost);
        }
    }
    
    if(debug){
        console.log("    " + Array.from(str1).join(" "));
        for(let y = 0; y < len2 + 1; y++){
            if(y !== 0){

            }
            console.log(((y === 0) ? " " : str2[y - 1]) + " " + grid[y].join(" "));
        }
    }
    
    //lower-right corner contains the number of operations needed to convert str1 to str2
    return grid[len2][len1];
}

function closestMatch2(str, possibleMatches, ignoreCase, debug=false){
    if(!Array.isArray(possibleMatches)){
        //only one possible match? That's the best option.
        return possibleMatches;
    }
    if(possibleMatches.length === 1){
        return possibleMatches[0];
    }
    
    let bestMatch = null;
    let bestDist = Number.MAX_VALUE;
    let currDist;
    possibleMatches.forEach((otherStr)=>{
        currDist = levenshteinDistance(str, otherStr, ignoreCase, debug);
        if(currDist === 0){
            //exact match
            return otherStr;
        }
        if(currDist < bestDist){
            bestMatch = otherStr;
            bestDist = currDist;
        }
    });
    return bestMatch;
}



function testLev(){
    let strings = ["apple", "banana", "orange", "blueberry", "grape"];
    
    strings.forEach((fruit)=>{
        strings.forEach((otherFruit)=>{
            console.log(fruit + " lev dist " + otherFruit + " = " + levenshteinDistance(fruit, otherFruit, false, true));
        });
    });
    console.log(levenshteinDistance("kitten", "sitting", false, true));
    console.log(levenshteinDistance("Saturday", "Sunday", false, true));
}

export {
    TextBox,
    levenshteinDistance,
    closestMatch2,
    testLev
}