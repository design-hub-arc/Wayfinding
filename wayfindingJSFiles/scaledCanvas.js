/*
The x and y coordinates given by the coordinate spreadsheet are those nodes' position on the autocad file where the data is extracted from.
This means that we can't draw point directly onto the SVG canvas, as the scaling is way off (x coordinates upwards of 2300 do not draw on a 1000 pixel canvas), and the autocad y-axis points upward (oh cartesian coordinates, why don't you point the logical way?) so all y - coordinates are negative, as the autocad map assigns coordinates from the upper-left corner (go figure)

This file is used to convert x y coordinates on the map image
to x y coordinates on the SVG canvas.
Also provides canvas functions
*/

class Canvas{
	constructor(){
        this.draw = undefined;           // the svg image this corresponds to
        this.scalingElement = undefined; // the svg element this gets its size from
        this.width = 0;                  // dimensions of the svg element
        this.height = 0;
        
        this.minX = 0;                   // coordinates of the upper-leftmost and lower-rightmost nodes
        this.minY = 0;
        this.maxX = 0;
        this.maxY = 0;
        
        this.color = undefined;
    }
	link(svgDrawer, scaler){
		"use strict";
		//better way?
		//maybe built-in creating the svg?
		try{
			this.draw = svgDrawer;
			this.scalingElement = scaler;
			this.width = scaler.width;
			this.height = scaler.height;
		} catch(e){
			console.log(e.stack);
		}
	}
	setColor(color){
		"use strict";
		this.color = color;
	}
	rect(x, y, w, h){
		"use strict";
		return this.draw.rect(w, h)
			.attr({fill: this.color})
			.move(this.x(x), this.y(y));
	}
	clear(){
		"use strict";
		var a = this.draw.children();
		for(var i = a.length - 1; i >= 0; i--){
			if(a[i].type === "rect" || a[i].type === "line" || a[i].type === "text"){
				a[i].remove();
			}
		}
	}
	resize(){
		"use strict";
		this.width = this.scalingElement
			.width
			.baseVal
			.value;
		this.height = this.scalingElement
			.height
			.baseVal
			.value;
	}
	text(text, x, y){
		"use strict";
		this.draw.text(text.toString())
			.move(this.x(x) - 10, 
				  this.y(y) - 20
				 ).attr({fill: this.color});
	}
	line(x1, y1, x2, y2){
		"use strict";
		this.draw.line(
			this.x(x1), 
			this.y(y1), 
			this.x(x2), 
			this.y(y2)
		).stroke({color: this.color, width: 3});
	}
	setCorners(x1, y1, x2, y2){
		// parameters are the corners of the map image used
		// it's fine if the y axis is reversed
		"use strict";
		this.minX = x1;
		this.minY = y1;
		this.maxX = x2;
		this.maxY = y2;
		this.calcSize();
	}
	calcSize(){
		"use strict";
		this.mapWidth = this.maxX - this.minX;
		this.mapHeight = this.maxY - this.minY;
	}
	x(coord){
		// convert a coordinate on the map image
		// to a point on the SVG canvas
		"use strict";
		var percRight = (coord - this.minX) / this.mapWidth;
		return percRight * this.width;
	}
	y(coord){
		"use strict";
		var percDown = (coord - this.minY) / this.mapHeight;
		return percDown * this.height;
	}
};