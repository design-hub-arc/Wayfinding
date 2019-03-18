/*
The x and y coordinates given by the coordinate spreadsheet are those nodes' position in the node management program where the data is extracted from.
Since the node manager and SVG canvas use different coordinate scales (node manager may be a 1000 by 1500 grid, SVG 800 by 1000, for example), 
so we need to convert coordinates in the node manager to coordinates on the SVG canvas.
This way, we can easily draw nodes on the canvas.

Canvas provides a way to interface with the SVG element used by the program

See http://svgjs.com for more information on the SVG elements used by the program
*/
export class Canvas{
	constructor(){
        this.draw = undefined;           // the svg image this corresponds to
        this.image = undefined;          // the image element this gets its size from
        this.destWidth = 0;              // dimensions of the map image
        this.destHeight = 0;
        
        this.sourceMinX = 0;             // coordinates of the upper-leftmost and lower-rightmost nodes
        this.sourceMinY = 0;
        this.sourceMaxX = 0;
        this.sourceMaxY = 0;
        
        this.color = undefined;
    }
	link(svgDrawer){
		/*
		Connects this to an SVG element
		and image.
		Might be a better way to do this.
		*/
		this.draw = svgDrawer;
	}
	
	//needs to be async because draw.image makes a requests to get the image
    async setImage(src){
        //scaler is an svg image
		return new Promise((resolve, reject)=>{
			this.image = this.draw.image(src);
			this.image.loaded(()=>{
				this.resize();
				resolve();
			});
		});
        
    }
	setColor(color){
		this.color = color;
	}
	clear(){
		let a = this.draw.children();
		for(let i = a.length - 1; i >= 0; i--){
			if(a[i].type === "rect" || a[i].type === "line" || a[i].type === "text"){
				a[i].remove();
			}
		}
	}
	rect(x, y, w, h){
		return this.draw.rect(w, h)
			.attr({fill: this.color})
			.move(this.x(x), this.y(y));
	}
	text(text, x, y){
		return this.draw.text(text.toString())
			.move(this.x(x) - 10, 
				  this.y(y) - 20
				 ).attr({fill: this.color});
	}
	line(x1, y1, x2, y2){
		return this.draw.line(
			this.x(x1), 
			this.y(y1), 
			this.x(x2), 
			this.y(y2)
		).stroke({color: this.color, width: 3});
	}
	setCorners(x1, y1, x2, y2){
		// parameters are the corners of the map image used
		this.sourceMinX = x1;
		this.sourceMinY = y1;
		this.sourceMaxX = x2;
		this.sourceMaxY = y2;
		this.calcSize();
	}
	resize(){
		/*
		Recalculates the size of the SVG image,
		so that way nodes don't appear skewed if the SVG changes size.
		
		Since the SVG isn't dynamic anymore, this isn't really used.
		
		Note that this doesn't change the size of the element,
		notifies the Canvas of the new size.
		*/
		this.destWidth = this.image.node.width.baseVal.value;
		this.destHeight = this.image.node.height.baseVal.value;
	}
	calcSize(){
		/*
		Calculates the width and height of the source coordinates
		*/
		this.mapWidth = this.sourceMaxX - this.sourceMinX;
		this.mapHeight = this.sourceMaxY - this.sourceMinY;
	}
	x(coord){
		// convert a coordinate on the map image
		// to a point on the SVG canvas
		let percRight = (coord - this.sourceMinX) / this.mapWidth;
		return percRight * this.destWidth;
	}
	y(coord){
		let percDown = (coord - this.sourceMinY) / this.mapHeight;
		return percDown * this.destHeight;
	}
};