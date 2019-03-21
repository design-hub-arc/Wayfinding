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
		addTool("get current path URL", ()=>document.getElementById("get current path URL").innerHTML = self.getPath().getURL());
		addTool("Save as SVG", ()=>self.saveAsSvg());
	}
	
	saveAsSvg(){
		gapi.auth2.getAuthInstance().signIn();
		
		console.log(this.canvas.draw.svg());
		
		let folderId = "176GK1W_9BOqWf0rHpM3cMNhQjSHIjfF2";
		
		let metadata = {
			"name" : this.currentPath.getURL() + ".svg",
			"mimeType" : "image/svg+xml",
			"parents" : [folderId]
		};
		
		let body = {
			"mimeType": "image/svg+xml",
			"body": this.canvas.draw.svg()
		};
		
		
		
		//https://tanaikech.github.io/2018/08/13/upload-files-to-google-drive-using-javascript/
		
		let form = new FormData();
		form.append("metadata", new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
		//form.append("file", new Blob([this.canvas.draw.svg()], {type: 'image/svg+xml'}));
		
		fetch("https://www.googleapis.com/upload/drive/v3/files", {
			method: "POST",
			headers: new Headers({
				"Authorization": "Bearer " + gapi.auth.getToken().access_token
			}),
			body: form
		}).then((response)=>{
			console.log(response);
			//                                                      how to get this from the response?
			fetch("https://www.googleapis.com/upload/drive/v3/files/1RcSjDErpDMhTSikZENpOp1oAgj-d0Elj?uploadType=media", {
				method: "PATCH",
				headers: new Headers({
					"Authorization": "Bearer " + gapi.auth.getToken().access_token
				}),
				"Content-Type": "image/svg+xml",
				"body": this.canvas.draw.svg()
			})
		}).catch((error)=>{
			console.log(error);
		});
		
		/*
		gapi.client.drive.files.create({
			"resource" : metadata
		}).then((r)=>{
			console.log(r);
			gapi.client.drive.files.update({
				fileId: r.result.id,
				media: body
			}).then((r)=>{
				console.log(r);
			});
			
		}).catch((r)=>{
			console.log(r);
		});
		*/
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