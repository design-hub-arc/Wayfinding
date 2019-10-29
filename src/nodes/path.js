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
        //from and to are nodes
        function travelInfo(from, to){
            return {
                from: from,
                to: to,
                dist: from.distanceFrom(to)
            };
        }
        let travelLog = new Stack();
        let travelHeap = new MinHeap((ti1, ti2)=>ti1.dist < ti2.dist);
        let visited = new Map();
        let curr = nodeDB.getNode(this.startId);
        let t = travelInfo(curr, curr);

        travelLog.push(t);
        visited.set(this.startId, true);
        while(curr.id !== this.endId){
            //get everything adjacent to curr
            curr.adj.forEach((node)=>{
                if(!visited.has(node.id)){
                    t = travelInfo(curr, node);
                    t.dist += travelLog.top.value.dist; //this is accumulated distance
                    travelHeap.siftUp(t);
                }
            });
            /*
            console.log(t);
            console.log("After sifting up");
            travelHeap.print();
            travelLog.print();
            console.log(visited);
            */
            do {
                t = travelHeap.siftDown();
                //console.log(t);
            } while(visited.has(t.to.id));
            travelLog.push(t);
            curr = t.to;
            visited.set(curr.id, true);

            //travelLog.print();
        }
        //backtrack
        let totalDist = travelLog.top.value.dist;
        let reversed = new Stack();
        while(!travelLog.isEmpty() && curr.id !== this.startId){
            t = travelLog.pop();
            if(t.to === curr && Math.abs(t.dist - totalDist) < 0.001){
                reversed.push(t);
                curr = t.from;
                totalDist -= t.from.distanceFrom(t.to);
            }
        }

        //reversed.print();
        let path = [nodeDB.getNode(this.startId)];
        while(!reversed.isEmpty()){
            path.push(reversed.pop().to);
        }
        
        let newDist = 0;
        for(let i = 0; i < path.length - 1; i++){
            newDist += path[i].distanceFrom(path[i + 1]);
        }
        this.idPath = path.map((node)=>node.id);
        this.pathLength = newDist;
        
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
        let minY = Number.MAX_VALUE;
        let maxY = Number.MIN_VALUE;
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

//these are used for Djdkstra's algorithm
class StackFrame{
    constructor(value){
        this.value = value;
        this.prev = null;
    }
}
class Stack{
    constructor(){
        this.top = null;
    }
    push(value){
        let newTop = new StackFrame(value);
        newTop.prev = this.top;
        this.top = newTop;
    }
    pop(){
        if(this.top === null){
            throw new Error("Nothing to pop");
        }
        let ret = this.top.value;
        this.top = this.top.prev;
        return ret;
    }
    isEmpty(){
        return this.top === null;
    }
    print(){
        let curr = this.top;
        console.log("Top of the stack");
        while(curr !== null){
            console.log(curr.value);
            curr = curr.prev;
        }
        console.log("Bottom of the stack");
    }
}

class MinHeap{
    /*
     * Comparison function is used to compare
     * the values inserted into the Heap.
     * Given inputs A and B,
     * comparisonFunction(A, B) should return true
     * if B is "greater than" A, and thus should sink
     * lower into the heap.
     */
    constructor(comparisonFunction){
        this.firstEmptyIdx = 0;
        this.values = [];
        this.comparator = comparisonFunction;
    }
    
    siftUp(value){
        if(this.firstEmptyIdx === this.values.length){
            //need to make room for the new value
            this.values.push(" ");
        }
        this.values[this.firstEmptyIdx] = value;
        this.firstEmptyIdx++;
        
        //swap until the value is in its proper place
        let idx = this.firstEmptyIdx - 1;
        let parentIdx = Math.floor((idx - 1) / 2); //a heap is technically a binary tree.
        let temp;
        //                                                   child is less than parent, so swap
        while(parentIdx >= 0 && idx !== 0 && this.comparator(this.values[idx], this.values[parentIdx])){
            temp = this.values[idx];
            this.values[idx] = this.values[parentIdx];
            this.values[parentIdx] = temp;
            idx = parentIdx;
            parentIdx = Math.floor((idx - 1) / 2);
        }
    }
    
    siftDown(){
        if(this.isEmpty()){
            throw new Error("Nothing to sift down");
        }
        //return topmost item, delete it from heap, sift everything else back into position
        let ret = this.values[0];
        //last becomes first
        this.values[0] = this.values[this.firstEmptyIdx - 1];
        this.firstEmptyIdx--;
        
        let idx = 0;
        let left = 1;
        let right = 2;
        let temp;
        while(
            ((left < this.firstEmptyIdx && this.comparator(this.values[left], this.values[idx]))) ||
            ((right < this.firstEmptyIdx && this.comparator(this.values[right], this.values[idx])))
        ){
            if(this.comparator(this.values[left], this.values[right])){
                temp = this.values[left];
                this.values[left] = this.values[idx];
                this.values[idx] = temp;
                idx = left;
            } else {
                temp = this.values[right];
                this.values[right] = this.values[idx];
                this.values[idx] = temp;
                idx = right;
            }
            left = idx * 2 + 1;
            right = idx * 2 + 2;
        }
        return ret;
    }
    
    isEmpty(){
        return this.firstEmptyIdx === 0;
    }
    
    print(){
        if(this.isEmpty()){
            return;
        }
        let row = 0;
        let col = 0;
        let rowWidth = 1;
        let nextRow = "        ";
        console.log("Heap:");
        console.log("    Row 0:");
        for(let i = 0; i < this.firstEmptyIdx; i++){
            nextRow += this.values[i] + " ";
            col++;
            if(col >= rowWidth && i < this.firstEmptyIdx - 1){
                row++;
                rowWidth *= 2;
                col = 0;
                console.log(nextRow);
                nextRow = "        ";
                console.log("    Row " + row + ":");
            }
        }
        console.log(nextRow);
    }
}

function testStack(){
    let vals = ["apple", "orange", "lemon", "lime", "blueberry"];
    let stack = new Stack();
    vals.forEach((val)=>stack.push(val));
    stack.print();
    while(!stack.isEmpty()){
        console.log("Popped " + stack.pop());
        stack.print();
    }
}
function testMinHeap(){
    let heap = new MinHeap((i, j)=>i < j);
    for(let i = 0; i < 10; i++){
        heap.siftUp(10 - i);
        heap.print();
    }
    while(!heap.isEmpty()){
        console.log("Sifted down " + heap.siftDown());
        heap.print();
    }
}

export {
    Stack,
    MinHeap,
    testStack,
    testMinHeap
};