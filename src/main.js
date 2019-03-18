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
		
		this.mode = "WAYFINDING";
		
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
	
	addDevTools(){
		/*
		Adds divs to to webpage which will allow
		us to test various features
		*/
		function addTool(text, onclick){
			let element = document.getElementById(text);
			if(element === null){
				element = document.createElement("div");
				element.setAttribute("id", text);
				document.body.appendChild(element);
			}
			element.onclick = onclick;
			element.innerHTML = text;
		}
		let self = this;
		addTool("Test all paths", ()=>self.testAllPaths());
		addTool("get current path URL", ()=>console.log(self.getPath().getURL()));
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
		
		if(params.get("dev")){
			this.addDevTools();
			console.log("adding dev");
		}
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