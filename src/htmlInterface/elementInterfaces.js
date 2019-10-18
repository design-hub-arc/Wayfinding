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
    
}

//WIP, doesn't work
function levenshteinDistance(str1, str2){
	let vector1 = [];
	let vector2 = [];
    let m = str1.length;
    let n = str2.length;
	let temp;
	let deleteCost;
	let insertCost;
	let changeCost;
	
    //https://en.wikipedia.org/wiki/Levenshtein_distance
	for(let i = 0; i < n + 1; i++){
		vector1.push(i);
	}
    //zero pad to access indexes
	for(let i = 0; i < n + 1; i++){
		vector2.push(0);
	}
	
	for(let i = 0; i < m; i++){
		vector2[0] = i + 1;
		
		for(let j = 0; j < n; j++){
			deleteCost = vector1[j + 1] + 1;
			insertCost = vector2[j] + 1;
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
	
	return vector1[n];
}

function testLev(){
    let strings = ["apple", "banana", "orange", "blueberry", "grape"];
    strings.forEach((fruit)=>{
        strings.forEach((otherFruit)=>{
            console.log(fruit + " lev dist " + otherFruit + " = " + levenshteinDistance(fruit, otherFruit));
        });
    });
}

export {
    TextBox,
    testLev
}