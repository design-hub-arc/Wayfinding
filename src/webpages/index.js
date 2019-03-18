import {
	Canvas
} from "../htmlInterface/scaledCanvas.js";
import {
	Main
} from "../main.js";
import {
	TextBox
} from "../htmlInterface/input.js";
import {
	InfoElement
} from "../htmlInterface/infoElement.js";
import {
	importDataInto
} from "../getRequests/importData.js";


export function init(){
	console.time("Time to load (wayfinding)");
	
	let master = new Main();
	
	let start = new TextBox("start box", "start hint");
	let end = new TextBox("end box", "end hint");
	let info = new InfoElement("moreInfo");
	
	//http://svgjs.com/
	let svgDrawer = SVG('wrapper').size(1000, 1000).panZoom();
	let masterCanvas = new Canvas();
	masterCanvas.link(svgDrawer);
	master.setCanvas(masterCanvas);
	
	master.setInput(start, end);
	
	master.setPathButton("button");
	master.addOnUpdatePath((path) => {
		info.update(master);
	});
	
	importDataInto(master).then((responses)=>{
		console.timeEnd("Time to load (wayfinding)");
	});
}

//need this (see index.html)
document.getElementById("wrapper").onload = function(){
	init();
}
console.log("done with index.js");

function nextImage() {
	if (master.getPath() !== undefined) {
		document.getElementById("image").src = master.getPath().nextImage();
	}
}