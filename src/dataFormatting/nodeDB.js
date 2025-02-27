import {Node} from '../nodes/arcNode.js';
import {formatResponse} from '../dataFormatting/csv.js';
import {closestMatch} from "../htmlInterface/elementInterfaces.js";

/*
NodeDB is used by the Main class to store the data used by the program.
It is initialized, filled with data, and applied to an instance of Main in
the HTML file.
*/
export class NodeDB{
	constructor(){
		this.nodes = new Map();
		/*
		Keys are integers, the node's ID, values are Node objects.
		Note that while we could store them as an array,
		we have nodes with negative IDs, and there are gaps in the IDs.
		
		Future versions of the node manager can get rid of this, 
		but shifting nodes -1 and -2 could be a problem,
		as those specific IDs denote map corners.
		*/
		
		this.stuffToNodeId = new Map();
		/*
		keys are a string, the name of the point (building/room/class name).
		value is associated node ID.
		
		Since we go by the pattern of "something" has a node ID associated with it,
		and we don't need to differentiate between rooms/buildings/etc,
		I can store them all in one place.
		
		Not sure which is most efficient:
		-Map
		-Object
		-Array
		*/
       
       this.allLabels = []; //need this for closest match
    }
    
	parseNodeData(responseText){
		/*
		Reads the response from the node spreadsheet,
		and creates and stores node objects based on that data.
		
		@param data : the result of an HTTP request to the node data spreadsheet, 
		can be either a string, or a two-dimentional array.
		*/
		
		let data = formatResponse(responseText);
		let row;
		let id;
		let x;
		let y;
		
		let errors = [];
		
		//skip headers
		for(let i = 1; i < data.length; i++){
			row = data[i];
			id = parseInt(row[0]);
			x = parseFloat(row[1]);
			y = parseFloat(row[2]);
			
			if(!isNaN(id) && !isNaN(x) && !isNaN(y)){
				this.nodes.set(id, new Node(
					id,
					x,
					y
				));
			} else {
				errors.push("An error occured for the line " + row.join());
			}
		}
		if(errors.length > 0){
			console.log("Something went wrong with parsing the node data:");
			errors.forEach(msg => console.log("--" + msg));
		}
	}
	
	parseNameToId(responseText){
		/*
		responseText is the result of an HTTP request to a csv file, formatted as:
		    header1, header2
			name, node id
			name, node id
			...
		
		This can be given as either a two-dimensional array,
		or a string, which it will convert into a two-d array.
		
		Inserts the name and id rows into this' stuffToNodeId Map
		*/
		let db = this;
		let name;
		let id;
		let data = formatResponse(responseText);
		let firstRow = true;
        
		data.forEach(row => {
			if(firstRow){
                firstRow = false;
                //skip first row
            } else {
                try{
                    name = row[0].toString().toUpperCase();
                    id = parseInt(row[1]);
        			if(isNaN(id)){
        				throw new Error(`Oops! Node ID of "${row[1]}": ID must be a number`);
        			} else {
            			db.stuffToNodeId.set(name, id);
                        this.getNode(id).addLabel(name);
                        this.allLabels.push(name);
                	}
				
            	} catch(err){
                	console.error("Invalid row: " + row);
                    console.error(err.message);
                }
            }
		});
	}
	
	parseConnData(responseText){
		/*
		@param responseText : the result of an HTTP request to the node data spreadsheet
		*/
		let data = formatResponse(responseText);
		
		let row;
		for(let i = 1; i < data.length; i++){
			row = data[i];
			try {
				this.getNode(parseInt(row[0])).addAdjId(parseInt(row[1]));
			} catch(e){
				console.log("Node not found: " + parseInt(row[1]));
				console.log(e.stack);
			}
		}
		let db = this;
		this.getAll().forEach(node => node.loadAdj(db));
	}
	
	parseImageResponse(csvFile){
		/*
        @param csvFile : a CsvFile object containing the result of a HTTP request to our image spreadsheet
        sets the connection images of nodes.
		
		Might redo this once we start working on images
        */
		let data = csvFile.getNonHeaders();
		let fromCol = csvFile.indexOfCol(["From", "node1", "n1"]);
		let toCol = csvFile.indexOfCol(["to", "node2", "n2"]);
		let imgCol = csvFile.indexOfCol(["image", "img", "photo", "url"]);
		
		//Skip header
		for(let i = 1; i < data.length; i++){
			//make sure all 3 rows exist
			if(data[i][fromCol] !== "" && data[i][toCol] !== "" && data[i][imgCol] !== ""){
				try{
					this.getNode(parseInt(data[i][fromCol])).setConnectionImage(data[i][toCol], data[i][imgCol]);
				} catch(e){
					console.log("An error occured while parsing image data:");
					console.log(e.stack);
				}
			}
		}
	}
	
	parseClassResponse(csvFile){
		/*
		@param responseText : the response from an XMLHTTP request 
		to a sheet containing class numbers and rooms
		
		We currenly can't use parseNameToId on this, as the class to building-room table does not use node IDs.
		Once I implement that feature to the node manager, we can eliminate this.
		*/
		let missingRooms = [];
		
		let data =        csvFile.getNonHeaders();
		let classCol =    csvFile.indexOfCol(["CLASS NUMBER", "CLASS"]);
        let buildingCol = csvFile.indexOfCol(["BUILDING"]);
		let roomCol =     csvFile.indexOfCol(["ROOM"]);
		
		let row;
		let nodeId;
		
		for(let i = 1; i < data.length; i++){
			row = data[i];
			nodeId = this.getIdByString((row[buildingCol] + " " + row[roomCol]).toUpperCase());
			
			if(nodeId == undefined){
				if(!missingRooms.includes(row[buildingCol] + " " + row[roomCol])){
					missingRooms.push(row[buildingCol] + " " + row[roomCol]);
				}
			} else{
				if(!isNaN(parseInt(nodeId))){
					this.stuffToNodeId.set(row[classCol].toString().toUpperCase(), parseInt(nodeId));
				}
			}
		}
		if(missingRooms.length !== 0){
			console.log("Could not find a node connected to rooms...");
			missingRooms.forEach(room => console.log("-" + room));
			console.log("Check the current room to node file in the google drive to see if these rooms are missing nodes.");
		}
	}
	
	getNode(id){
		/*
		@param id : a number, the ID of the node to return
		@return a Node from the database with an ID matching the once passed in
		TODO: decide what to do about invalid IDs
		*/
		let ret = null;
		try{
			ret = this.nodes.get(parseInt(id));
			if(!(ret instanceof Node)){
				throw Error("Node with id of " + id + " does not exist"); 
			}
		} catch(e){
			console.log(e.stack);
		}
		return ret;
	}
	
	getIdByString(string){
		/*
		@param string : a string, what to search for in buildings, rooms, and class numbers
		
		returns an integer, the id of the node with the given string associated with it, or undefined if it doesn't exist
		
		may move this to getNode, just making it check if parameter is integer or string. Could cause problems with class numbers
		*/
		
        //first, try the easy solution
		let ret = this.stuffToNodeId.get(string.toString().toUpperCase());
		
        //nope. Need to find the closest match
        if(ret === undefined){
            ret = this.stuffToNodeId.get(closestMatch(string.toString().toUpperCase(), this.allLabels, true));
        }
		if(ret === undefined){
			console.log("Couldn't find node identified by " + string);
		}
		
		return ret;
	}
	
	getStringsById(id){
		/*
		returns all labels associated with the given node
		*/
		let ret = [];
		
		this.stuffToNodeId.forEach((nodeId, label) =>{
			if(nodeId === id){
				ret.push(label);
			}
		});
		
		return ret;
	}
	
	getAllNames(){
		/*
		Returns an array of strings,
		the names of all named nodes
		(buildings, rooms, etc)
		*/
		return Array.from(this.stuffToNodeId.keys());
	}
	
	getAll(){
		/*
		Gets all the nodes stored here
		*/
		return Array.from(this.nodes.values());
	}
	
	prettyPrintStuffToId(){
		let longestName = 0;
		this.getAllNames().forEach(name => {
			if(name.length > longestName){
				longestName = name.length;
			}
		});
		let spaceCount = 0;
		let padding = " ";
		let i;
		
		this.stuffToNodeId.forEach((id, name) => {
			spaceCount = longestName - name.length;
			padding = " ";
			for(i = 0; i < spaceCount; i++){
				padding += " ";
			}
			console.log(name + padding + id);
		});
	}
	generateDivs(main) {
		//used to detect connection errors
		this.getAll().forEach(node => node.generateDiv(main));
	}
	
	drawAll(canvas){
		//canvas is an instance of the program's Canvas object, not HTML canvas
		this.getAll().forEach(node => {
			node.draw(canvas);
			node.drawLinks(canvas);
		});
	}
};