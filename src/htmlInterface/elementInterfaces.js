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

//it works?
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
		//console.log(vector1);
		//console.log(vector2);	
		temp = vector1;
		vector1 = vector2;
		vector2 = temp;
	}
	
	//console.log(vector1);
	//console.log(vector2);
	
	return vector1[n];
}

function levDist2D(str1, str2){
    let len1 = str1.length;
    let len2 = str2.length;
    let grid = [];
    let deleteCost;
	let insertCost;
	let changeCost;
    
    for(let y = 0; y < len2 + 1; y++){
        grid.push([]);
        for(let x = 0; x < len1 + 1; x++){
            grid[y].push(0);
        }
    }
    
    //fill in
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
    
    console.log("    " + Array.from(str1).join(" "));
    for(let y = 0; y < len2 + 1; y++){
        if(y !== 0){
            
        }
        console.log(((y === 0) ? " " : str2[y - 1]) + " " + grid[y].join(" "));
    }
    
    //lower-right corner contains the number of operations needed to convert str1 to str2
    return grid[len2][len1];
}

function testLev(){
    let strings = ["apple", "banana", "orange", "blueberry", "grape"];
    /*
    strings.forEach((fruit)=>{
        strings.forEach((otherFruit)=>{
            console.log(levDist2D(fruit, otherFruit));
            console.log(fruit + " lev dist " + otherFruit + " = " + levenshteinDistance(fruit, otherFruit));
        });
    });*/
    console.log(levDist2D("kitten", "sitting"));
}

export {
    TextBox,
    testLev
}