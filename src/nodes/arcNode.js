/*
Nodes are points on the ARC canvas.

See path.js for how the program uses these nodes, and scaledCanvas for how it uses the coordinates
*/
export class Node{
    constructor(id, x, y) {
        /*
		id is a unique identifier
        like a primary key
		
        x and y are coordinates on the map image,
		as extracted from the node spreadsheet.
		*/
		
        try {
            this.id = parseInt(id);
            if (isNaN(this.id)) {
                throw new TypeError("Node id must be an integer");
            }
        } catch (idError) {
            console.log(idError.stack);
        }

        try {
            this.x = parseFloat(x);
            this.y = parseFloat(y);
            if (isNaN(this.x) || isNaN(this.y)) {
                throw new TypeError("X and Y must be numbers");
            }
        } catch (latLngError) {
            console.log(latLngError);
        }

        this.adjIds = [];
		/*
        adjIds is an array of ints,
        each int represents the id
        of an adjacent node.
        i.e. you can travel from this point to that one
        */
		
        this.connectionImages = {};
		/*
		key is the id of a node this connects to,
		value is the URL of an image of the path between this node and that one
		*/
    }
	loadAdj(nodeDB) {
		/*
		Creates an array of Nodes,
		the array contains all the
		Nodes adjacent to this one.
	
		Has to be invoked after 
		initializing all Nodes,
		otherwise you will reference
		nonexistant variables.
		
		nodeDB is a node database object 
		containing the nodes used by the program
	
		automatically invoked by importNodeData
		*/
		this.adj = [];
		
        let check;
		for (let i = 0; i < this.adjIds.length; i++) {
			check = nodeDB.getNode(this.adjIds[i]);
			if (check) {
				this.adj.push(check);
			}
		}
	}
	
	distanceFrom(n2) {
		return Math.sqrt(
			Math.pow(this.x - n2.x, 2) + Math.pow(this.y - n2.y, 2)
		);
	}
	
	addAdjId(id){
		// adds an adjacent ID
		this.adjIds.push(id);
	}
	
	setConnectionImage(id, url) {
		// invoked by importImages in import data file
		// sets the image going from this node to node with id equal to the id passed
		this.connectionImages[id] = url;
	}
	getHasImage(id) {
		// returns whether or not an image has been given showing the area 
		//between this node and node with id equal to the id passed
		return this.connectionImages.hasOwnProperty(id);
	}
	getImageTo(id) {
		// returns the image of going from this node to node with id equal to the id passed
		return this.connectionImages[id];
	}

	draw(canvas) {
		canvas.setColor("red");
		canvas.rect(this.x, this.y, 5, 5);
	}
	drawId(canvas){
		canvas.setColor("red");
		canvas.text(this.id, this.x, this.y);
	}
	drawLinks(canvas) {
		// draws lines connecting this node to its adjacent nodes
		canvas.setColor("red");
		this.drawId(canvas);
		for (let j = 0; j < this.adj.length; j++) {
			this.adj[j].draw(canvas);
			canvas.line(this.x, this.y, this.adj[j].x, this.adj[j].y);
		}
	}
	generateDiv(main) {
		// used for testing
		let node = this;
		let canvas = main.getCanvas();
		
        //draws this node's links
		let f = function () {
			node.draw(canvas);
			node.drawLinks(canvas);
		};
        
        //redraws the current path
		let f2 = function (){
			canvas.clear();
			let path = main.getPath();
			if (path !== undefined) {
				path.draw(canvas);
			}
			main.getNodeDB().generateDivs(main);
		};
        
        //logs the node's data
		let f3 = function(){
			console.log(node);
		};
		
		node.drawId(canvas);
		canvas.rect(this.x, this.y, 10, 10).mouseover(f).mouseout(f2).click(f3);
        //                                            ^ display links when hovered over,
        //                                                        ^ redraw the path when mouse exits
        //                                                                  ^ display data when clicked
	}
};