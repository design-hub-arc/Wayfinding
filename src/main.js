/*
The Main class is used to store data, preventing the need for global variables.
It also takes a lot of code out of the main HTML file.

May clean this up more once we have access to the class database (not my fake one, the real one that eservices uses)
*/

import { Path } from             "./nodes/path.js";
import { getParamsFromURL } from "./htmlInterface/qrCodes.js";
import { NodeDB } from           "./dataFormatting/nodeDB.js";

export class Main{
    constructor(){
        this.canvas = undefined;

        //html elements
        this.start = undefined;
        this.end = undefined;
        this.pathButton = undefined;

        this.currentPath = undefined;
        this.nodeDatabase = new NodeDB();
		
		this.onUpdatePath = []; //an array of functions
    }
	setCanvas(canvas){
		// canvas is my custom Canvas class, NOT HTML canvas
		this.canvas = canvas;
	}
	getCanvas(){
		return this.canvas;
	}
	
	setInput(start, end){
		/*
		start and end are TextBoxes.
		Populates said TextBoxes with the contents of this' fake database when notifyImportDone is called
		*/
		this.start = start;
		this.end = end;
	}
	
	setClassFinder(nameTextBox, instructorTextBox, timesTextBox, buttonId, resultsId, clearId){
		/*
		loads the contents of this' Class database into the options of the three passed in text boxes,
		then makes button change the contents of result based on the results of each of the three boxes when clicked
		
		@param nameTextBox : a TextBox, used to allow the user to enter the name of their class
		@param instructorTextBox : also a TextBox, where the user enters the name of the instructor for their class
		@param timesTextBox : once more, a TextBox, used to enter the meeting time(s) for the class
		@param buttonId : the id of an HTML element that can handle onclick events
		@param resultsId : the id of a select element which will display the class numbers the user is searching for once the button is clicked
		@param clearId : the id of an HTML element that can handle onclick events which, when clicked, will clear out each of the user input boxes
		if either the buttonId, resultsId, or clearId elements do not exist, creates them for you
		*/
		let db = this.classDatabase;
		let main = this;
		let button = document.getElementById(buttonId);
		let result = document.getElementById(resultsId);
		let clear = document.getElementById(clearId);
		
		if(button === null){
			button = document.createElement("button");
			button.setAttribute("id", buttonId);
			button.innerHTML = "Find class number";
			document.body.appendChild(button);
		}
		if(result === null){
			result = document.createElement("select");
			result.setAttribute("id", resultsId);
			document.body.appendChild(result);
		}
		if(clear === null){
			clear = document.createElement("button");
			clear.setAttribute("id", clearId);
			clear.innerHTML = "Clear input";
			document.body.appendChild(clear);
		}
		
		nameTextBox.addOptions(db.getAllClassNames());
		instructorTextBox.addOptions(db.getAllInstructors());
		timesTextBox.addOptions(db.getAllMeetingTimes());
		
		button.onclick = function(){
			//first, gather all the data fields, then get class numbers from them
			function toInt(num){
				/*
				can't just do .map(parseInt), 
				as map will implicitly pass in the index as the second parameter of parseInt,
				which is the base of the string passed in,
				causing errors.
				If no second parameter is given, parseInt defaults to base 10
				*/
				return parseInt(num);
			}
			let results = [
				db.getNumbersByName      (nameTextBox.getResult())      .map(toInt),
				db.getNumbersByInstructor(instructorTextBox.getResult()).map(toInt),
				db.getNumbersByTime      (timesTextBox.getResult())     .map(toInt)
			]; //this is an array of arrays
			let validResults = []; //which results can be compared
			let setTo = ["class not found"]; //what the dropbox will be set to
			
			//then, check if the result set contains any data.
			//this way, we won't be comparing valid data to an empty set
			results.forEach(array =>{
				if(array.length > 0){
					validResults.push(array);
				}
			});
			
			if(validResults.length === 0){
				setTo = ["class not found"];
			} else if(validResults.length === 1){
				setTo = validResults[0];
			} else {
				//find a class present in each data set
				//iterate through each element in the first set of valid results
				validResults[0].forEach(item => {
					setTo = [];
					let match = true;
					
					//check if each other valid result set contains said value
					for(let i = 1; i < validResults.length && match; i++){
						match = (validResults[i].indexOf(item) !== -1);
					}
					if(match){
						setTo.push(item);
					}
				});
			}
			
			//erase the current contents of dropdown
			while(result.length > 0){
				result.remove(result.length - 1);
			}
			
			//then repopulate it
			let newElem;
			setTo.forEach(opt =>{
				newElem = document.createElement("option");
				newElem.text = opt;
				result.add(newElem);
			});
			result.onchange();
		};
		
		clear.onclick = function(){
			nameTextBox.setInput("");
			instructorTextBox.setInput("");
			timesTextBox.setInput("");
		};
		
		result.onchange = function(){
			nameTextBox.setInput(      db.select(db.NAME, db.NUMBER, result.value)[0]);
			instructorTextBox.setInput(db.select(db.INSTRUCTOR, db.NUMBER, result.value)[0]);
			timesTextBox.setInput(     db.select(db.MEETING_TIME, db.NUMBER, result.value)[0]);
		};
	}
	
	setPathButton(id){
		/*
		id is the id of any HTML element
		if it doesn't exist, will create it for you
		*/
		this.pathButton = document.getElementById(id);
		if(this.pathButton === null){
			this.pathButton = document.createElement("button");
			this.pathButton.setAttribute("id", id);
			this.pathButton.innerHTML = "Draw Path";
			document.body.appendChild(this.pathButton);
		}
		
		let main = this;
		this.pathButton.onclick = function(){
			console.log("click");
			if(main.start.isValid() && main.end.isValid()){
				//updatepath does the finding
				main.updatePath();
			} else {
				console.log("Not valid: " + main.start.getResult() + " " + main.end.getResult());
			}
		};
	}
	
	setPath(path){
		if(path.valid){
			this.currentPath = path;
			this.onUpdatePath.forEach(func => {
				func(path);
			});
			
			try{
				path.draw(this.canvas);
			} catch(e){
				console.log("Main's canvas is not defined yet");
				console.log(e.stack);
			}
		} else {
			console.log("Not valid: " + path);
		}
	}
	getPath(){
		return this.currentPath;
	}
	
	updatePath(){
		try{
			console.log("update");
			let start = this.getNodeDB().getIdByString(this.start.getResult());
			let end = this.getNodeDB().getIdByString(this.end.getResult());
			
			//single equal will catch both null and undefined
			if(start != null && end != null){ //otherwise some class numbers cause problems
				let newPath = new Path(start, end, this);
				if(newPath.valid){
					this.setPath(newPath);
				} else {
					throw new Error("Invalid path: " + newPath.idPath);
				}
			} else {
				throw new Error("Invalid start and end points: " + this.start.getResult() + " " + this.end.getResult());
			}
		} catch(e){
			console.log(e.stack);
		}
	}
	
	notifyImportDone(){
		/*
		Called after the initial import.
		Updates this' various components with the newly imported data.
		
		1. Sets the size of the canvas
		2. Populates the TextBoxes
		3. Sets the default path
		*/
		
		let upperLeft = this.nodeDatabase.getNode(-1);
		let lowerRight = this.nodeDatabase.getNode(-2);
		let params = getParamsFromURL();
		
		this.canvas.setCorners(
			upperLeft.x,
			upperLeft.y,
			lowerRight.x,
			lowerRight.y
		);
		
		this.start.addOptions(this.getNodeDB().getAllNames());
		this.end.addOptions(this.getNodeDB().getAllNames());
		
		this.setPath(new Path(
			params.get("startID"), 
			params.get("endID"), 
			this
		));
	}
	
	testAllPaths(){
		//developer tool. Detects any paths between any two nodes that cannot exist
		
		let source = this;
		let nodeDB = source.getNodeDB();
		
		let points = [];
		points = points.concat(nodeDB.getAllNames());
		
		function checkPath(startStr, endStr){
			try{
				let id1 = nodeDB.getIdByString(startStr);
				let id2 = nodeDB.getIdByString(endStr);
				
				//getIdByString will log any errors
				if(id1 != null && id2 != null){
					let path = new Path(id1, id2, source);
					if(!path.valid){
						throw new Error("Invalid Path: " + path.idPath);
					}
				}
			} catch(e){
				console.log(e.stack);
			}
		}
		
		alert("Please wait while I process " + (points.length * points.length) + " paths...");
		for(let i = 0; i < points.length; i++){
			for(let j = 0; j < points.length; j++){
				checkPath(points[i], points[j]);
			}
		}
		alert("Done.");
	}
	
	setNodeDB(database){
		this.nodeDatabase = database;
	}
	getNodeDB(){
		return this.nodeDatabase;
	}
	
	/*
	Adds a function that will be invoked whenever the path is updated.
	passes the new Path to the function when this.setPath is called
	*/
	addOnUpdatePath(func){
		if(func && {}.toString.call(func) === "[object Function]"){
			this.onUpdatePath.push(func);	
		} else {
			throw new Error("Not a function! " + func.toString());
		}
		
	}
};