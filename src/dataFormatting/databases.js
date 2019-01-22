/*
This file is used to create the fake databases used by the program.
THESE ARE NOT REAL DATABASES
hopefully one day we'll have our own SQL server to store stuff on.



SQL to Database class:

	CREATE TABLE x {
		col1,
		col2,
		col3
	};

	translates to...

	let x = new Database(["col1", "col2", "col3"]);



	INSERT INTO x VALUES (a, b, c)

	is...

	x.insert([a, b, c]);



	SELECT COLA FROM x WHERE COLB=val;

	can be done with...

	x.select("COLA", "COLB", val);



	SELECT DISTINCT COL FROM x;

	translates to...

	x.getColumn("COL");



	SELECT * FROM x;

	sort of tranlates to...

	x.logAll();
	but it just outputs the data, it doesn't return the data
*/
import {Node} from '../nodes/arcNode.js';


export class Database{
    constructor(headers){
        /*
        @param headers : an array of strings, the column names
        */
        "use strict";

        if(!Array.isArray(headers)){
            headers = [headers];
        }

        this.headers = [];
        this.rows = [];
        this.headerString = "";

        let h;
        for(let i = 0; i < headers.length; i++){
            h = headers[i].toString().toUpperCase();
            while(h.indexOf(" ") !== -1){
                h = h.replace(" ", "_");
            }
            this.headers.push(h);
            this.headerString += (h + " ");
            this[h] = i; //makes enum
        }

        this.sourceHeaders = [];
    }
	insert(data){
		/*
        @param data : an array with length equal to this.headers.length, the data to insert into the table
        each element in data can be any type
        INSERT INTO this VALUES (data)
        */
        "use strict";
		try{
			if(!Array.isArray(data)){
				data = [data];
			}
			if(data.length !== this.headers.length){
				throw new RangeError("Invalid column count, must contain columns " + this.headerString);
			}
			
            this.rows.push(data);
		} catch(e){
			console.log(e.stack);
		}
	}
	selectF(retCol, checkCol, callback){
		/*
        @param retCol : an int, the index of the column to return. Should be an enum value of this db
        @param checkCol : an int, the index of the column to compare to checkVal
        @param callback : a function which takes something as a parameter, and returns true or false
        @return an array of any single type, containing any values from retCol from rows
            where callback(checkCol) is true
        
        SELECT retCol FROM database WHERE callback(checkCol)
        */
        
        "use strict";
		let ret = [];
		try{
			//checking
			if(retCol >= this.headers.length){
				throw new RangeError("Invalid index for retCol");
			}
			if(checkCol >= this.headers.length){
				throw new RangeError("Invalid index for checkCol");
			}
			
			this.rows.forEach(row => {
				let check = row[checkCol];
				if(callback(check)){
					ret.push(row[retCol]);
				}
			});
		}catch(e){
			console.log(e.stack);
		}
		return ret;
	}
	select(retCol, checkCol, checkVal){
		/*
        @param retCol : an int, the index of the column to return. Should be an enum value of this db
        @param checkCol : an int, the index of the column to compare to checkVal
        @param checkVal : can be any type, the value to compare checkCol to
        @return an array of any single type, containing any values from retCol from rows
            where checkCol === checkVal
        
        SELECT retCol FROM database WHERE checkCol=checkVal;
		maybe add returning a new Database?
        */
        
        "use strict";
		checkVal = checkVal.toString().toUpperCase();
		return this.selectF(retCol, checkCol, data => (data.toString().toUpperCase() === checkVal));
	}
	getColumn(col){
		/*
        @param col : an int, an enum value for this, the column number to return
        @return an array containing each unique value from the given column
        SELECT DISTINCT columnName FROM database
        */
        
        "use strict";
		let ret = [];
		
		if(col >= this.headers.length){
			throw new RangeError("Invalid column");
		}
		
		let item;
		try{
			for(let i = 0; i < this.rows.length; i++){
				item = this.rows[i][col];
				if(ret.indexOf(item) === -1){
					ret.push(item);
				}
			}
		}catch(e){
			console.log(e.stack);
		}
		return ret;
	}
	logAll(){
        /*
        prints the contents of the database
        SELECT * FROM this
        */
        
		"use strict";
		console.log(this.headerString);
		for(let i = 0; i < this.rows.length; i++){
			let row = "";
			for(let j = 0; j < this.rows[i].length; j++){
				row += this.rows[i][j];
				if(j !== this.rows[i].length - 1){
					row += ", ";
				}
			}
			console.log(row);
		}
	}
};

/*
NodeDB is used by the Main class to store the data used by the program.
It is initialized, filled with data, and applied to an instance of Main in
the HTML file.
*/
export class NodeDB extends Database{
	constructor(){
        "use strict";
        super(["NODE ID", "NODE OBJECT"]);
		/*
		Since we go by the pattern of "something" has a node ID associated with it,
		and we don't need to differentiate between rooms/buildings/etc,
		I can store them all in one place.
		
		Not sure which is most efficient:
		-Map
		-Object
		-Array
		*/
        this.stuffToNodeId = new Map();
		// keys are a string, the name of the point (building/room/class name)
		// value is associated node ID
    }
    
	parseNodeData(data){
		/*
		@param data : the result of an HTTP request to the node data spreadsheet, converted to a 2D array for convenience
		*/
		"use strict";
		
		let row;
		let id;
		//skip headers
		for(let i = 1; i < data.length; i++){
			row = data[i];
			id = parseInt(row[0]);
			if(!this.getNode(id)){
				this.addRecord(new Node(
					id,
					parseFloat(row[1]),
					parseFloat(row[2])
				));
			}
		}
	}
	
	parseNameToId(data){
		/*
		data is the result of an HTTP request to a csv file, formatted as:
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
		
		//is it an array?
		if(!Array.isArray(data)){
			data = data.split(/\r?\n|\r/);
		}
		
		//what about 2D?
		if(data.some(element => !Array.isArray(element))){
			data = data.map(row => row.split(","));
		}
		
		//allright, now it's in the right format
		
		data.forEach(row => {
			try{
				name = row[0].toString().toUpperCase();
				id = parseInt(row[1]);
				
				if(isNaN(id)){
					// the first row will fail, because of the header, so don't throw an error
					console.log("Oops! Node ID of " + row[1]);
				} else {
					db.stuffToNodeId.set(name, id);
				}
				
			} catch(err){
				console.log("Invalid row: " + row);
				console.log(err.message);
			}
		});
	}
	
	parseConnData(data){
		/*
		@param data : the result of an HTTP request to the node data spreadsheet, converted to a 2D array for convenience
		*/
		"use strict";
		
		let row;
		for(let i = 1; i < data.length; i++){
			row = data[i];
			try {
				this.getNode(parseInt(row[0])).addAdjId(parseInt(row[1]));
			} catch(e){
				console.log("Node not found: " + parseInt(row[1]));
			}
		}
		let db = this;
		this.getAll().forEach(node => node.loadAdj(db));
		this.logOneWayNodes();
	}
	
	parseImageResponse(csvFile){
		/*
        @param csvFile : a CsvFile object containing the result of a HTTP request to our image spreadsheet
        sets the connection images of nodes
        */
        "use strict";
		let data = csvFile.getNonHeaders();
		let fromCol = csvFile.indexOfCol(["From", "node1", "n1"]);
		let toCol = csvFile.indexOfCol(["to", "node2", "n2"]);
		let imgCol = csvFile.indexOfCol(["image", "img", "photo", "url"]);
		
		//Skip header
		for(let i = 1; i < data.length; i++){
			//make sure all 3 rows exist
			if(data[i][fromCol] !== "" && data[i][toCol] !== "" && data[i][imgCol] !== ""){
				let nodes = this.select(this.NODE_OBJECT, this.NODE_ID, parseInt(data[i][fromCol]));
				if(nodes.length === 1){
					nodes[0].setConnectionImage(data[i][toCol], data[i][imgCol]);
				} else {
					console.log("Error: invalid nodes returned by get, should return only 1: ");
					console.log(data[i]);
				}
			}
		}
	}
	
	parseBuildingResponse(csvFile){
		/*
        @param csvFile : a CsvFil containing the result of a HTTP request to our building file
        sets the associated building for each node
        */
        
		
        "use strict";
		let data = csvFile.getNonHeaders();
		let nameCol = csvFile.indexOfCol(["Name", "building", "building name", "buildingname"]);
		let idCol = csvFile.indexOfCol(["id", "node", "node id", "nodeid"]);
		let row;
		
		for(let i = 0; i < data.length; i++){
			row = data[i];
			this.stuffToNodeId.set(row[nameCol].toUpperCase(), parseInt(row[idCol]));
		}
	}
	
	parseRoomResponse(csvFile){
		/*
        @param csvFile : a CsvFile containing the result of a HTTP request to our room file
        sets the associated room of each node
        */
        
        "use strict";
		let data = csvFile.getNonHeaders();
		
		let roomCol = csvFile.indexOfCol(["room", "room number"]);
		let nodeCol = csvFile.indexOfCol(["node", "associated node"]);
		
		let node;
		let row;
		for(let i = 1; i < data.length; i++){
			row = data[i];
			this.stuffToNodeId.set(row[roomCol].toUpperCase(), parseInt(row[nodeCol]));
		}
	}
	
	parseClassResponse(csvFile){
		/*
		@param responseText : the response from an XMLHTTP request 
		to a sheet containing class numbers and rooms
		*/
		"use strict";
		let data =        csvFile.getNonHeaders();
		let classCol =    csvFile.indexOfCol(["CLASS NUMBER", "CLASS"]);
        let buildingCol = csvFile.indexOfCol(["BUILDING"]);
		let roomCol =     csvFile.indexOfCol(["ROOM"]);
		
		let row;
		let nodeIds;
		for(let i = 1; i < data.length; i++){
			row = data[i];
			nodeIds = this.getIdsByString((row[buildingCol] + " " + row[roomCol]).toUpperCase());
			
			if(nodeIds.length === 0){
				console.log("Could not find a node connected to room " + row[buildingCol] + " " + row[roomCol]);
			} else{
				if(!isNaN(parseInt(nodeIds[0]))){
					this.stuffToNodeId.set(row[classCol].toString().toUpperCase(), parseInt(nodeIds[0]));
				}
			}
		}
	}
	
	
	addRecord(node){
		/*
		@param node : a Node instance, the node to add to the database
		*/
		"use strict";
		this.insert([parseInt(node.id), node]);
	}
	
	getNode(id){
		/*
		@param id : a number, the ID of the node to return
		@return a Node from the database with an ID matching the once passed in
		TODO: decide what to do about invalid IDs
		*/
		"use strict";
		let ret = null;
		try{
			ret = this.select(this.NODE_OBJECT, this.NODE_ID, id)[0];
		} catch(e){
			console.log(e.stack);
		}
		return ret;
	}
	
	getAllIds(){
		"use strict";
		return this.getColumn(this.NODE_ID);
	}
	
	getAllNames(){
		/*
		Returns an array of strings,
		the names of all named nodes
		(buildings, rooms, etc)
		*/
		return Array.from(this.stuffToNodeId.keys())
	}
	
	getAll(){
		"use strict";
		return this.getColumn(this.NODE_OBJECT);
	}
	
	getIdsByString(string){
		/*
		@param string : a string, what to search for in buildings, rooms, and class numbers
		*/
		"use strict";
		string = string.toString().toUpperCase();
		
		let ret = [];
		
		this.stuffToNodeId.forEach((id, name) => {
			//apparently, Map.forEach passes in value, key; not key, value
			if(name.toUpperCase() == string){
				ret.push(id);
			}
		});
		
		return ret;
	}
	
	prettyPrintStuffToId(){
		let longestName = 0
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
	
	logOneWayNodes(){
		/*
		Detects nodes with a one-way relationship with other nodes
		ex. node 1 connects to node 2, but node 2 doesn't connect to node 1
		fixes the errors
		*/
		"use strict";
		let allNodes = this.getAll();
		
		for(let i = 0; i < allNodes.length; i++){
			let current = allNodes[i];
			for(let j = 0; j < current.adj.length && current.id >= 0; j++){
				if(!current.adj[j].adjIds.includes(current.id)){
					//console.log("Node with ID " + current.adj[j].id + " needs to connect with node " + current.id);
					current.adj[j].adjIds.push(current.id);
					current.adj[j].loadAdj(this);
				}
			}
		}
	}
	
	countConnections(){
		// counts how many different connections exist
		"use strict";
		let nodeConn = 0;
		let allNodes = this.getAll();
		
		for(let i = 0; i < allNodes.length; i++){
			nodeConn += allNodes[i].adj.length;
		}
		console.log("Total connections between nodes: " + nodeConn);
	}
	
	generateDivs(main) {
		//used to detect connection errors
		"use strict";
		this.getAll().forEach(node => node.generateDiv(main));
	}
	
	drawAll(canvas){
		//canvas is an instance of the program's Canvas object, not HTML canvas
		"use strict";
		this.getAll().forEach(node => {
			node.draw(canvas);
			node.drawLinks(canvas);
		});
	}
};

/*
ClassDB is used by the Main class to store the data used by the class locator.
Once again, the HTML file does the populating
*/
export class ClassDB extends Database{
    constructor(){
        "use strict";
        //number is the five digit class number
        super(["NUMBER", "NAME", "INSTRUCTOR", "ROOM", "MEETING TIME"]);
    }
	parseResponse(csvFile){
		"use strict";
		let data = csvFile.getNonHeaders();
		let classNumCol =   csvFile.indexOfCol(["CLASS #", "CLASS NUMBER"]);
		let subjCol =       csvFile.indexOfCol(["SUBJ CD", "SUBJECT"]);
		let numCol =        csvFile.indexOfCol(["CAT NBR", "NUMBER"]);
		let startTimeCol =  csvFile.indexOfCol(["BEG TIME", "START TIME"]);
		let endTimeCol =    csvFile.indexOfCol(["END TIME"]);
		let daysCol =       csvFile.indexOfCol(["DAYS"]);
        let buildingCol =   csvFile.indexOfCol(["BUILDING"]);
		let roomCol =       csvFile.indexOfCol(["ROOM"]);
		let instructorCol = csvFile.indexOfCol(["INSTRCTR", "INSTRUCTOR"]);
		
		let row;
		let name;
		//skip headers
		for(let i = 1; i < data.length; i++){
			row = data[i];
			try{
				//name = row[instructorCol.]
				this.addRecord(
					row[classNumCol],
					row[subjCol] + " " + row[numCol],
					row[instructorCol],
					row[buildingCol] + " " + row[roomCol],
					row[daysCol] + " " + row[startTimeCol] + " - " + row[endTimeCol]
				);
			} catch(e){
				console.log(e.stack);
			}
		}
	}
	addRecord(number, name, instructor, room, times){
		"use strict";
		this.insert([number, name, instructor, room, times]);
	}
	getNumbersByName(className){
		"use strict";
		return this.select(this.NUMBER, this.NAME, className.toUpperCase());
	}
	getNumbersByInstructor(instructorName){
		"use strict";
		return this.select(this.NUMBER, this.INSTRUCTOR, instructorName.toUpperCase());
	}
	getNumbersByTime(time){
		"use strict";
		return this.select(this.NUMBER, this.MEETING_TIME, time.toUpperCase());
	}
	getAllClassNumbers(){
		"use strict";
		return this.getColumn(this.NUMBER);
	}
	getAllClassNames(){
		"use strict";
		return this.getColumn(this.NAME);
	}
	getAllInstructors(){
		"use strict";
		return this.getColumn(this.INSTRUCTOR);
	}
	getAllMeetingTimes(){
		"use strict";
		return this.getColumn(this.MEETING_TIME);
	}
};