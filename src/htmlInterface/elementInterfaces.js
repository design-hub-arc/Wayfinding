/* 
 * This file contains all the classes that are used to interact with HTML elements.
 * 
 * Upon changing the index.html file, you will likely need to change this one.
 */




/*
The x and y coordinates given by the coordinate spreadsheet are those nodes' position in the node management program where the data is extracted from.
Since the node manager and SVG canvas use different coordinate scales (node manager may be a 1000 by 1500 grid, SVG 800 by 1000, for example), 
so we need to convert coordinates in the node manager to coordinates on the SVG canvas.
This way, we can easily draw nodes on the canvas.

Canvas provides a way to interface with the SVG element used by the program

See http://svgjs.com for more information on the SVG elements used by the program
*/
class Canvas{
	constructor(){
        this.draw = null;           // the svg image this corresponds to
        this.image = null;          // the image element this gets its size from
        this.destWidth = 0;              // dimensions of the map image
        this.destHeight = 0;
        
        this.sourceMinX = 0;             // coordinates of the upper-leftmost and lower-rightmost nodes
        this.sourceMinY = 0;
        this.sourceMaxX = 0;
        this.sourceMaxY = 0;
        
        this.color = undefined;
    }
	linkToSVG(svgDrawer){
		/*
		Connects this to an SVG element
		and image.
		Might be a better way to do this.
		*/
		this.draw = svgDrawer;
	}
	
	//needs to be async because draw.image makes a requests to get the image
    async setImage(src){
		return new Promise((resolve, reject)=>{
            this.image = this.draw.image(src);
			this.image.loaded(()=>{
                //this.draw.size("100%", "100%");
                /*
                 * For some reason svg.js is having an 
                 * issue where it doesn't render the 
                 * entire image until the user clicks
                 * and moves the image. Setting the
                 * viewbox to itself forces it to reload,
                 * aleviating the issue.
                 */
                this.draw.viewbox(this.draw.viewbox());
				this.resize();
				resolve();
			});
		});
        
    }
	setColor(color){
		this.color = color;
	}
	clear(){
		let a = this.draw.children();
		for(let i = a.length - 1; i >= 0; i--){
			if(a[i].type === "rect" || a[i].type === "line" || a[i].type === "text"){
				a[i].remove();
			}
		}
	}
	rect(x, y, w, h){
		return this.draw.rect(w, h)
			.attr({fill: this.color})
			.move(this.x(x), this.y(y));
	}
	text(text, x, y){
		return this.draw.text(text.toString())
			.move(this.x(x) - 10, 
				  this.y(y) - 20
				 ).attr({fill: this.color});
	}
	line(x1, y1, x2, y2){
		return this.draw.line(
			this.x(x1), 
			this.y(y1), 
			this.x(x2), 
			this.y(y2)
		).stroke({color: this.color, width: 3});
	}
	setCorners(x1, y1, x2, y2){
		// parameters are the corners of the map image used
		this.sourceMinX = x1;
		this.sourceMinY = y1;
		this.sourceMaxX = x2;
		this.sourceMaxY = y2;
		this.calcSize();
	}
	resize(){
		/*
		Recalculates the size of the SVG image,
		so that way nodes don't appear skewed if the SVG changes size.
		
		Note that this doesn't change the size of the element,
		notifies the Canvas of the new size.
		*/
        
		this.destWidth = this.image.node.width.baseVal.value;
		this.destHeight = this.image.node.height.baseVal.value;
	}
	calcSize(){
		/*
		Calculates the width and height of the source coordinates
		*/
		this.mapWidth = this.sourceMaxX - this.sourceMinX;
		this.mapHeight = this.sourceMaxY - this.sourceMinY;
	}
	x(coord){
		// convert a coordinate on the map image
		// to a point on the SVG canvas
		let percRight = (coord - this.sourceMinX) / this.mapWidth;
		return percRight * this.destWidth;
	}
	y(coord){
		let percDown = (coord - this.sourceMinY) / this.mapHeight;
		return percDown * this.destHeight;
	}
    download(name){
        //https://stackoverflow.com/questions/13405129/javascript-create-and-save-file?noredirect=1&lq=1
        
        //need to resize the SVG to contain the entire image
        let oldViewBox = this.draw.viewbox();
        this.draw.viewbox(0, 0, this.destWidth, this.destHeight);
        let result = this.draw.svg();
        this.draw.viewbox(oldViewBox);
        
        let file = new Blob([result], {type: "image/svg+xml"});
        let a = document.createElement("a");
        let url = URL.createObjectURL(file);
        a.href = url;
        a.download = name;
        document.body.append(a);
        console.log("downloading \n" + result);

        a.click();
        setTimeout(async()=>{
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
};



/*
 * In Artfinding, some nodes have URLs associated with them.
 * When linked with a Main object, this class will update a list of URLs
 * to show the URLs of the last node in a path.
 */
class UrlList{
    constructor(elementId){
        if(elementId.startsWith("#")){
            elementId = elementId.substring(1);
        }
        this.element = document.getElementById(elementId);
        if(this.element === null){
            throw new Error("Could not find element with id " + elementId);
        }
    }
    
    update(path){
        //remove all previous links
        while(this.element.hasChildNodes()){
            this.element.removeChild(this.element.childNodes[0]);
        }
        let node = path.nodePath[path.nodePath.length - 1];
        let ele;
        let a;
        //add a list item for each URL on that node
        node.getLabels().forEach((label)=>{
            label = label.toLowerCase();
            if(label.includes("http")){
                ele = document.createElement("li");
                a = document.createElement("a");
                a.innerText = label;
                a.setAttribute("href", label);
                a.setAttribute("target", "_blank");
				ele.appendChild(a);
				this.element.appendChild(ele);
            }
        });
    }
}


/*
 * The TextBox class is an input box, followed by a display element.
 * It functions like an option dropdown in that it can only have valid values selected,
 * but instead of showing all the user's options at once,
 * if shows the option from its option list which most closely matches the user's input.
 * 
 * after creating a TextBox, you will need to populate its option by calling...
 * textBox.addOptions(anArray);
 * calling the getResult method will return the option which is closest to the user input.
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
        this.closest = null;
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
		this.closest = closestMatch(this.box.value, this.options, true);
        this.resultElement.innerHTML = this.closest;
	}
	isValid(){
		//legal input was entered
		//want to make sure the closest match is both in the options, and not the default option
		return this.closest !== null && this.options.indexOf(this.closest.toUpperCase()) > 0;
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
		return this.closest;
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

function closestMatch(str, possibleMatches, ignoreCase, debug=false){
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
    let len = possibleMatches.length;
    
    //                        break upon finding exact match
    for(let i = 0; i < len && bestDist !== 0; i++){
        currDist = levenshteinDistance(str, possibleMatches[i], ignoreCase, debug);
        if(currDist < bestDist){
            bestMatch = possibleMatches[i];
            bestDist = currDist;
        }
    }
    
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
    Canvas,
    UrlList,
    TextBox,
    levenshteinDistance,
    closestMatch,
    testLev
}