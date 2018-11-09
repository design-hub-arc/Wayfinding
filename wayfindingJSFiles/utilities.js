/*
 * Allows for easier class extention and inheritance
 * HOW TO USE:
 *   function a(...){}
 *   a.prototype = {...};
 *   
 *   function b(...){
 *      a.call(this, ...);
 *   }
 *   b.prototype = {...};
 *   
 *   extend(b, a);
 *
 * Think of it as 'class b extends a'
 * gives b access to all of a's methods, but DOES NOT OVERRIDE ANY OF b's
 */
function extend(constructor, superConstructor){
	"use strict";
    var superProto = Object.create(superConstructor.prototype);
    for(var method in superProto){
        if(!constructor.prototype.hasOwnProperty(method)){
            //don't overwrite existing properties
            constructor.prototype[method] = superProto[method];
        }
    }
}

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