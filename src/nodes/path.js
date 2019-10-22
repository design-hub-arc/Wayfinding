/*
Path is used to store a collection of Nodes that connect together
to form a path between two Nodes. 

HOW A PATH IS FOUND:
1. Every Node has a list of Nodes that connect to it, called adjacent nodes.
2. If node A is adjacent to node B, then a path exists between them.
3. Similarly, if node B also connects to node C, then there exists a path A-B-C
4. Now, repeat this process until there exists a path between the start and end points given.
read this for a better explaination: https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm
*/

//use this in conjunction with Node
export class Path{
    constructor(startId, endId, dataSource) {
        /*
        start and endId are node IDs
        dataSource is a Main object
        
        idPath is an array of numbers, the ids of the nodes the path goes through
        nodePath is the corresponding nodes
        pathLength is the total length of the distance between all the nodes used in the path
            it doesn't matter what scale it's in, as it is just used to compare in bestPath
        images is an array of strings, the URLs of the path's images
        imageInd is the index of the image currently displayed in main (in development)
        */
		
		this.mode = dataSource.mode;
		
        this.startId = parseInt(startId);
        this.endId = parseInt(endId);
        this.dataSource = dataSource;

        this.valid = true;

        this.idPath = [];
        this.nodePath = [];
        this.pathLength = 0;
        this.loadPath();

        this.decodeIds();
        this.images = this.getImages();
        this.imgInd = -1; // increments before getting image
    }
	decodeIds() {
		// generates nodePath
		this.nodePath = [];
		for (let i = 0; i < this.idPath.length; i++) {
			this.nodePath[i] = this.dataSource.getNodeDB().getNode(this.idPath[i]);
		}
	}
	loadPath() {
		/*
		this is the big one.

		Dijkstra's algorithm.
		https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm
		Thanks Kevin
		sets this.idPath to shortest path when complete
		*/
		
		if(this.startId === this.endId){
			this.idPath = [this.startId];
			this.pathLength = 0;
			return;
        }
		
		let nodeDB = this.dataSource.getNodeDB();
		let allNodes = nodeDB.getAll();
		
		// start by declaring letiables
		let unvisited = []; // unchecked nodes. Store as Node.
		let dists = {}; // distances from start. Store as id : number
		let prev = {}; // previous node in best path. Store as id : id

		// initialize values
		for (let i = 0; i < allNodes.length; i++) {
			unvisited[i] = allNodes[i];
			dists[allNodes[i].id] = Infinity;
			prev[allNodes[i].id] = undefined;
		}
		dists[this.startId] = 0; // distance from start to start is 0

		function smallestIndex() {
			/*
			Returns the index of the node with the shortest distance from start
			that has yet to be visited
			*/
			let index = 0;
			for (let i = 0; i < unvisited.length; i++) {
				if (dists[unvisited[i].id] < dists[unvisited[index].id]) {
					index = i;
				}
			}
			return index;
		}

		// run while there are still nodes to visit
		while (unvisited.length > 0) {
			let index = smallestIndex();

			let nearest = unvisited[index];
			unvisited.splice(index, 1); // remove nearest from unvisited, as we are visiting it

			// find which of its adjacent nodes are closest to start
			for (let j = 0; j < nearest.adj.length; j++) {
				if (unvisited.includes(nearest.adj[j])) {
					let check = dists[nearest.id] + nearest.distanceFrom(nearest.adj[j]); // distance from start to i
					//                                                V     is this right?
					if (dists[nearest.adj[j].id] === Infinity || check < nearest.adj[j].distanceFrom(nodeDB.getNode(this.startId))) {
						dists[nearest.adj[j].id] = check;
						prev[nearest.adj[j].id] = nearest.id;
					}
				}
			}
		}

		// generate the path
		let path = [];
		let id = this.endId;
		while (prev[id] !== undefined) {
			path.push(id);
			id = prev[id];
		}
		
		if(nodeDB.getNode(this.startId).adjIds.indexOf(path[path.length - 1]) !== -1){
			path.push(this.startId);	
		}
		path = path.reverse();
		this.idPath = path;
		this.pathLength = dists[this.endId];
		
		if(this.startId !== this.idPath[0] || this.endId !== this.idPath[this.idPath.length - 1]){
			this.invalidate();
		}
		if((this.startId < 0) || (this.endId < 0)){
			this.invalidate();
		}
	}
	invalidate(){
		if(this.valid){
			//prevent doubling up on this message
			this.valid = false;
			try {
				console.log("Invalid path detected: ");
				console.log(this);
				throw new Error();
			} catch(e){
				console.log(e.stack);
			}
		}
	}
    /*
     * Used to find the smallest and largest
     * X and Y coordinates of any node in this path,
     * effectively creating a rectangle around the path.
     * 
     * returns an object with the following properties:
     * -minX: the leftmost x coordinate of the rectangle
     * -maxX: the rightmost x coordinate of the rectangle
     * -minY: the topmost y coordinate of the rectangle
     * -maxY: the bottommost y coordinate of the rectangle
     */
    calculateBounds(){
        let minX = Number.MAX_VALUE;
        let maxX = Number.MIN_VALUE;
        let minY = Number.MIN_VALUE;
        let maxY = Number.MAX_VALUE;
        this.nodePath.forEach((node)=>{
            if(node.x < minX){
                minX = node.x;
            }
            if(node.x > maxX){
                maxX = node.x;
            }
            if(node.y < minY){
                minY = node.y;
            }
            if(node.y > maxY){
                maxY = node.y;
            }
        });
        return {
            "minX" : minX,
            "minY" : minY,
            "maxX" : maxX,
            "maxY" : maxY
        };
    }
	getURL() {
		let origURL = window.location.href;
		let split = origURL.split("?");
		return split[0] + "?startID=" + this.idPath[0] + "&endID=" + this.idPath[this.idPath.length - 1] + "&mode=" + this.mode;
	}

	draw(canvas) {
		canvas.clear();
		canvas.setColor("red");
		
		let p = this.nodePath;
		p[0].draw(canvas);

		for (let i = 1; i < p.length; i++) {
			canvas.line(p[i-1].x, p[i-1].y, p[i].x, p[i].y);
			p[i].draw(canvas);
		}
	}
	getImages() {
		// returns an array of strings, each element is the url of a path image
		let ret = [];
		let ind = 0;
		while (ind + 1 < this.idPath.length) {
			ind++; // skips 0 so we can compare two nodes
			let n1 = this.nodePath[ind - 1];
			let n2 = this.nodePath[ind];
			if (n1.getHasImage(n2.id)) {
				let url = n1.getImageTo(n2.id);
				if (ret.indexOf(url) === -1) {
					ret.push(url);
				}
			}
		}
		return ret;
	}
	nextImage() {
		// grabs the next image from this.images
		// make sure not to go out of range
		if (this.imgInd + 1 < this.images.length) {
			this.imgInd++;
		} else {
			this.imgInd = 0;
		}

		return (this.images.length !== 0) ? this.images[this.imgInd] : " "; // if this path has no images, return a blank string
	}
};