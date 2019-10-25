/*
The App class is used to store data, preventing the need for global variables.
It also serves to link all of the GUI elements together
It also takes a lot of code out of the main HTML file.
*/

import { Path } from         "./nodes/path.js";
import { QrCodeParams } from "./htmlInterface/qrCodes.js";
import { NodeDB } from       "./dataFormatting/nodeDB.js";
import { 
    Canvas,
    TextBox,
    UrlList,
    testLev
} from "./htmlInterface/elementInterfaces.js";

export class App{
    constructor(){
        //html elements
        this.canvas = null;
        this.start = null;
        this.end = null;
        this.pathButton = null;
		this.urlList = null;
        this.pathUrlElementId = null;
		
        this.currentPath = null;
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
		this.canvas = new Canvas(svgElement);
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
		
		this.pathButton.onclick = ()=>{
			this.updatePath();
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
     * Sets which element will display the URL for the current path
     */
    setUrlDisplay(elementId){
        let e = document.getElementById(elementId);
        if(e === null){
            throw new Error("Couldn't find element with ID " + elementId);
        }
        this.pathUrlElementId = elementId;
    }
    
    /*
     * When the element with the given ID is clicked,
     * copies the path URL to the clipboard
     */
    setUrlCopyButton(elementId){
        let e = document.getElementById(elementId);
        if(e === null){
            throw new Error("Couldn't find element with ID " + elementId);
        }
        e.onclick = ()=>{
            //https://css-tricks.com/native-browser-copy-clipboard/
            let range = document.createRange();
            range.selectNode(document.getElementById(this.pathUrlElementId));
            window.getSelection().addRange(range);
            try{
                document.execCommand("copy");
            }catch(ex){
                console.error(ex);
            }
            window.getSelection().removeAllRanges();
            alert("Copied link");
        };
    }
    
    /*
     * After calling this method,
     * when the element with the given ID is clicked,
     * downloads the current map as an SVG
     */
	setDownloadButton(elementId){
        let e = document.getElementById(elementId);
        if(e === null){
            throw new Error("Couldn't find element with ID " + elementId);
        }
        e.onclick = ()=>{
            this.canvas.download(this.currentPath.getURL() + ".svg");
        };
    }
	
    
    /*
     * Path related methods.
     */
    
	setPath(path){
        if(!path.valid){
            throw new Error("Invalid path: " + path);
        }
        this.currentPath = path;
        this.urlList.update(path);
        if(this.pathElementId !== null){
            document.getElementById(this.pathUrlElementId).innerText = path.getURL();
        }

        path.draw(this.canvas);
        // ###############################
        // center the view on the new path
        // ###############################
        let bounds = path.calculateBounds();
        //set the new zoom
        let bw = (bounds.maxX - bounds.minX);
        let bh = (bounds.maxY - bounds.minY);
        let zx = (bw === 0) ? 0 : this.canvas.destWidth / bw;
        let zy = (bh === 0) ? 0 : this.canvas.destHeight / bh;
        let zoom = Math.min(zx, zy, 0.5);
        this.canvas.draw.zoom(zoom);
        
        //AFTER zooming in, get the size of the viewbox
        let w = this.canvas.draw.viewbox().width;
        let h = this.canvas.draw.viewbox().height;
        //the center of the bounds
        let cx = (bounds.minX + bounds.maxX) / 2;
        let cy = (bounds.minY + bounds.maxY) / 2;
        let newBox = {
            x: this.canvas.x(cx) - w / 2,
            y: this.canvas.y(cy) - h / 2,
            width: w,
            height: h
        };
        this.canvas.draw.viewbox(newBox);
        /*
        console.log("Setting viewbox to ", newBox);
        console.log("Bounds are ", bounds);
        console.log(`Zoom is the max of ${zx}, ${zy}, 0.5`);
        */
    }
    
    /*
     * Updates the path to reflect the input of this' start and end input boxes
     */
	updatePath(){
        if(!this.start.isValid()){
            throw new Error("Invalid: " + this.start.getResult());
        }
        if(!this.end.isValid()){
            throw new Error("Invalid: " + this.end.getResult());
        }
        let start = this.getNodeDB().getIdByString(this.start.getResult());
        let end = this.getNodeDB().getIdByString(this.end.getResult());
        let newPath = new Path(start, end, this);
        if(newPath.valid){
            this.setPath(newPath);
        } else {
            throw new Error("Invalid path: ", newPath);
        }
	}
    
	getPath(){
		return this.currentPath;
	}
	
	getNodeDB(){
		return this.nodeDatabase;
	}
	
    //working here #######################################
    
    //move some of the stuff from importDataInto(master) to this
	async notifyImportDone(responses){
		/*
		Called after the initial import.
		Updates this' various components with the newly imported data.
		
		1. Sets the size of the canvas
		2. Populates the TextBoxes
		3. Sets the default path
		*/
        const params = new QrCodeParams();
        this.mode = params.wayfindingMode;
        
        console.time("set image");
		await this.canvas.setImage(responses.get("map image"));
        console.timeEnd("set image");
        this.nodeDatabase.parseNodeData(responses.get("Node coordinates"));
        this.nodeDatabase.parseConnData(responses.get("Node connections"));
        this.nodeDatabase.parseNameToId(responses.get("labels"));
		const upperLeft = this.nodeDatabase.getNode(-1);
		const lowerRight = this.nodeDatabase.getNode(-2);
		
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
		addTool("Test levenshtine", ()=>testLev());
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
};