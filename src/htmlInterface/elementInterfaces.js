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
    testLev
}