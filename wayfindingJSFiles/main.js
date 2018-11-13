/*
The Main class is used to store data, preventing the need for global variables.
It also takes a lot of code out of the main HTML file.
*/

function Main(){
	"use strict";
	this.canvas = undefined;
	
	//html elements
	this.start = undefined;
	this.end = undefined;
	this.pathButton = undefined;
	
	this.currentPath = undefined;
	this.nodeDatabase = undefined;
	this.classDatabase = undefined;
	
	this.pathFinder = undefined; //need until we get rid of duplicate class ids
}
Main.prototype = {
	setCanvas : function(canvas){
		"use strict";
		// canvas is my custom Canvas class, NOT HTML canvas
		this.canvas = canvas;
	},
	getCanvas : function(){
		"use strict";
		return this.canvas;
	},
	
	setInput : function(start, end){
		/*
		start and end are TextBoxes.
		Populates said TextBoxes with the contents of this' fake database
		*/
		"use strict";
		this.start = start;
		this.end = end;
		var db = this.getNodeDB();
		
		start.addOptions(db.getAllBuildingNames());
		start.addOptions(db.getAllRooms());
		start.addOptions(db.getAllClasses());
		
		end.addOptions(db.getAllBuildingNames());
		end.addOptions(db.getAllRooms());
		end.addOptions(db.getAllClasses());
	},
	
	setClassFinder : function(nameTextBox, instructorTextBox, timesTextBox, buttonId, resultsId, clearId){
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
		"use strict";
		var db = this.getClassDB();
		var main = this;
		var button = document.getElementById(buttonId);
		var result = document.getElementById(resultsId);
		var clear = document.getElementById(clearId);
		
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
			var results = [
				main.getClassDB().getNumbersByName      (nameTextBox.getResult())      .map(toInt),
				main.getClassDB().getNumbersByInstructor(instructorTextBox.getResult()).map(toInt),
				main.getClassDB().getNumbersByTime      (timesTextBox.getResult())     .map(toInt)
			]; //this is an array of arrays
			var validResults = []; //which results can be compared
			var setTo = ["class not found"]; //what the dropbox will be set to
			
			//then, check if the result set contains any data.
			//this way, we won't be comparing valid data to an empty set
			results.forEach(function(array){
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
				validResults[0].forEach(function(item){
					setTo = [];
					var match = true;
					
					//check if each other valid result set contains said value
					for(var i = 1; i < validResults.length && match; i++){
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
			var newElem;
			setTo.forEach(function(opt){
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
	},
	
	setPathButton : function(id){
		/*
		id is the id of any HTML element
		if it doesn't exist, will create it for you
		*/
		"use strict";
		this.pathButton = document.getElementById(id);
		if(this.pathButton === null){
			this.pathButton = document.createElement("button");
			this.pathButton.setAttribute("id", id);
			this.pathButton.innerHTML = "Draw Path";
			document.body.appendChild(this.pathButton);
		}
		
		var main = this;
		this.pathButton.onclick = function(){
			if(main.start.isValid() && main.end.isValid()){
				//updatepath does the finding
				main.updatePath(
					main.start.getResult(),
					main.end.getResult()
				);
			}
		};
	},
	setPathFinder : function(pathFinder){
		"use strict";
		this.pathFinder = pathFinder;
		pathFinder.setDataSource(this);
	},
	
	setPath : function(path){
		"use strict";
		if(path.valid){
			this.currentPath = path;
			try{
				path.draw(this.canvas);
			} catch(e){
				console.log("Main's canvas is not defined yet");
				console.log(e.stack);
			}
		}
	},
	getPath : function(){
		"use strict";
		return this.currentPath;
	},
	
	updatePath : function(data1, data2){
		"use strict";
		try{
			var start = this.getNodeDB().getIdsByString(data1);
			var end = this.getNodeDB().getIdsByString(data2);
			
			if(start.length >= 1 && end.length >= 1){ //otherwise some class numbers cause problems
				//var newPath = new Path(start[0], end[0], this);
				var newPath = this.pathFinder.find(data1, data2);
				if(newPath.valid){
					this.setPath(newPath);
				} else {
					throw new Error("Invalid path: " + newPath.idPath);
				}
			} else {
				throw new Error("Invalid number of nodes: " + start.length + " " + end.length);
			}
		} catch(e){
			console.log(e.stack);
		}
	},
	
	testAllPaths : function(){
		//developer tool. Detects any paths between any two nodes that cannot exist
		"use strict";
		
		var source = this;
		var nodeDB = source.getNodeDB();
		
		var points = [];
		points = points.concat(nodeDB.getAllBuildingNames());
		points = points.concat(nodeDB.getAllRooms());
		points = points.concat(nodeDB.getAllClasses());
		
		function checkPath(startStr, endStr){
			try{
				var id1 = nodeDB.getIdsByString(startStr);
				var id2 = nodeDB.getIdsByString(endStr);
				
				if(id1.length !== 1 || id2.length !== 1){
					throw new Error("Invalid node count: " + startStr + ": " + id1.length + " " + endStr + ": " + id2.length);
				} else {
					var path = new Path(id1[0], id2[0], source);
					if(!path.valid){
						throw new Error("Invalid Path: " + path.idPath);
					}
				}
			} catch(e){
				console.log(e.stack);
			}
		}
		
		alert("Please wait while I process " + (points.length * points.length) + " paths...");
		for(var i = 0; i < points.length; i++){
			for(var j = 0; j < points.length; j++){
				checkPath(points[i], points[j]);
			}
		}
		alert("Done.");
	},
	
	setNodeDB : function(database){
		"use strict";
		this.nodeDatabase = database;
	},
	getNodeDB : function(){
		"use strict";
		return this.nodeDatabase;
	},
	
	setClassDB : function(database){
		"use strict";
		this.classDatabase = database;
	},
	getClassDB : function(){
		"use strict";
		return this.classDatabase;
	}
};