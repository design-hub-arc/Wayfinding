/*
The App class is used to store data, preventing the need for global variables.
It also serves to link all of the GUI elements together
It also takes a lot of code out of the main HTML file.
*/

import { Path } from         "./nodes/path.js";
import { QrCodeParams } from "./htmlInterface/qrCodes.js";
import { NodeDB } from       "./dataFormatting/nodeDB.js";
import { testLev } from        "./htmlInterface/elementInterfaces.js";
import { 
    Canvas,
    TextBox,
    UrlList
} from "./htmlInterface/elementInterfaces.js";

export class App{
    constructor(){
        //html elements
        this.canvas = null;
        this.start = null;
        this.end = null;
        this.pathButton = null;
		this.urlList = null;
		
        this.currentPath = undefined;
        this.nodeDatabase = new NodeDB();
		
		this.mode = "WAYFINDING";
    }
    
    /*
     * HTML element methods
     */
    
    /*
     * Adds an SVG element to the
     * element with the given id,
     * then creates a Canvas on that element,
     * allowing the class to render paths.
     */
	createCanvas(elementId){
        let svgElement = SVG(elementId).panZoom({zoomMin: 0.5, zoomMax: 5});
            //.size("100%", "100%")
		this.canvas = new Canvas();
        this.canvas.linkToSVG(svgElement);
	}
	getCanvas(){
		return this.canvas;
	}
	
    
    /*
     * Creates a TextBox from the given elements.
     * The app uses these elements to read and display input. 
     * Populates said TextBoxes with the contents of this' fake database when notifyImportDone is called.
     */
	createStartInputBox(inputBoxId, resultDisplayId){
		this.start = new TextBox(inputBoxId, resultDisplayId);
	}
    
    /*
     * Creates a TextBox from the given elements.
     * The app uses these elements to read and display input. 
     * Populates said TextBoxes with the contents of this' fake database when notifyImportDone is called.
     */
	createEndInputBox(inputBoxId, resultDisplayId){
		this.end = new TextBox(inputBoxId, resultDisplayId);
	}
    
    
	/*
    Id is the id of any HTML element.
    When the given element is clicked,
    Updates the path based on what is entered in the input boxes
    */
    setPathButton(id){
		this.pathButton = document.getElementById(id);
		if(this.pathButton === null){
			throw new Error(`No element with an ID of ${id} exists.`);
		}
		
		let app = this;
		this.pathButton.onclick = ()=>{
			if(app.start.isValid() && app.end.isValid()){
				//updatepath does the finding
				app.updatePath();
			} else {
				console.log("Not valid: " + app.start.getResult() + " " + app.end.getResult());
			}
		};
	}
    
    
	/*
     * Creates a UrlList,
     * which will update to show all
     * URLs associated with a path
     * when it updates
	*/
	createUrlList(elementId){
        this.urlList = new UrlList(elementId);
	}
	
	
    
    /*
     * Path related methods.
     * Working here.
     * MAKE THIS LESS CONVOLUTED!!!
     */
    
    
    
	setPath(path){
		if(path.valid){
			this.currentPath = path;
			this.urlList.update(path);
			
			try{
				path.draw(this.canvas);
                
                //shift the canvas to center on the new path
                //not working, as ...draw.cx() is returning NaN
                /*
                let bounds = path.calculateBounds();
                let cx = this.canvas.x((bounds.minX + bounds.maxX) / 2);
                let cy = this.canvas.y((bounds.minY + bounds.maxY) / 2);
                console.log(cx, cy);
                console.log(this.canvas.draw.cx(), this.canvas.draw.cy());
                this.canvas.draw.center(cx, cy);
                */
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
			let start = this.getNodeDB().getIdByString(this.start.getResult());
			let end = this.getNodeDB().getIdByString(this.end.getResult());
			
			//single equal will catch both null and undefined
			if(start != null && end != null){ //otherwise some class numbers cause problems
				let newPath = new Path(start, end, this);
				if(newPath.valid){
					this.setPath(newPath);
				} else {
					throw new Error("Invalid path: ", newPath);
				}
			} else {
				throw new Error("Invalid start and end points: " + this.start.getResult() + " " + this.end.getResult());
			}
		} catch(e){
			console.error(e.stack);
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
        addTool("Test levenshtine", ()=>testLev());
	}
	
	saveAsSvg(){
		/*
		This is just awfull. 
		Google's 'how to post to drive' guides are useless,
		I've tried at least 10 different solutions,
		and nothing else works.
		Yes, this is horrible,
		but unless someone else can figure this out,
		it'll have to stay this way.
		*/
		let folderId = "176GK1W_9BOqWf0rHpM3cMNhQjSHIjfF2"; //the generatedSvgImages folder on the google drive
		let metadata = {
			"name" : this.currentPath.getURL() + ".svg",
			"mimeType" : "image/svg+xml",
			"parents" : [folderId]
		};
		let form = new FormData();
		form.append("metadata", new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
		
		gapi.auth2.getAuthInstance().signIn().then((response)=>{
			let h = new Headers({
				"Authorization" : "Bearer " + gapi.auth.getToken().access_token,
			});
			
			fetch("https://www.googleapis.com/upload/drive/v3/files", {
				method: "POST",
				headers: h,
				body: form
			}).then((response)=>{
				console.log(response);
				response.json().then((json)=>{
					let fileId = json.id;
					console.log(fileId);
					fetch("https://www.googleapis.com/upload/drive/v3/files/" + fileId + "?uploadType=media", {
						method: "PATCH",
						headers: h,
						"Content-Type": "image/svg+xml",
						body: this.canvas.draw.svg()
					});
				});
			}).catch((error)=>{
				console.log(error);
			});
		});
	}
	
	notifyImportDone(){
		/*
		Called after the initial import.
		Updates this' various components with the newly imported data.
		
		1. Sets the size of the canvas
		2. Populates the TextBoxes
		3. Sets the default path
		*/
		
		const upperLeft = this.nodeDatabase.getNode(-1);
		const lowerRight = this.nodeDatabase.getNode(-2);
		const params = new QrCodeParams();
        let startId;
        let endId;
        
        this.start.addOptions(this.getNodeDB().getAllNames());
		this.end.addOptions(this.getNodeDB().getAllNames());
        
        if(params.startMode === QrCodeParams.ID_MODE){
            let names = this.nodeDatabase.getNode(params.start).getLabels();
            if(names.length > 0){
                this.start.setInput(names[0]);
            }
            startId = params.start;
            
        } else {
            startId = this.nodeDatabase.getIdByString(params.start);
            this.start.setInput(params.start);
        }
        
        if(params.endMode === QrCodeParams.ID_MODE){
            let names = this.nodeDatabase.getNode(params.end).getLabels();
            if(names.length > 0){
                this.end.setInput(names[0]);
            }
            endId = params.end;
        } else {
            endId = this.nodeDatabase.getIdByString(params.end);
            this.end.setInput(params.end);
        }
        
        //params.displayData();
        
		this.canvas.setCorners(
			upperLeft.x,
			upperLeft.y,
			lowerRight.x,
			lowerRight.y
		);
        
		this.setPath(new Path(
			startId, 
			endId, 
			this
		));
		
		if(params.devMode){
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
};