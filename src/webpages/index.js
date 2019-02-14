import {getParamsFromURL} from                     "../htmlInterface/qrCodes.js";
import {Canvas} from                               "../htmlInterface/scaledCanvas.js";
import {Path} from                                 "../nodes/path.js";
import {Main} from                                 "../main.js";
import {TextBox} from                              "../htmlInterface/input.js";
import {importWayfinding, importArtfinding} from   "../getRequests/importData.js";
import {mapURL, masterSheetURL, artFinderURL} from "../getRequests/urls.js";
import {NodeDB} from                               "../dataFormatting/nodeDB.js";

let master = new Main();

//http://svgjs.com/
let svgDrawer = SVG('wrapper').size(1000, 1000).panZoom();
let svgMap = svgDrawer.image(mapURL);
svgMap.loaded(() => {
	console.time("Time to load");
	// need to wait to invoke since we need image width
	let nodes = new NodeDB();
	let masterCanvas = new Canvas();
	let params = getParamsFromURL();
	let start = new TextBox("start box", "start hint");
	let end = new TextBox("end box", "end hint");
	master.setInput(start, end);

	master.setNodeDB(nodes);
	masterCanvas.link(svgDrawer, document.getElementById("wrapper")
				.getElementsByTagName("svg")[0]
				.getElementsByTagName("image")[0]
			   );
	masterCanvas.resize();
	master.setCanvas(masterCanvas);
	master.setPathButton("button");
	
	
	
	importWayfinding(masterSheetURL, master).then((responses) => {
		console.timeEnd("Time to load");
	});
	
	
	
	if(params.get("mode").toUpperCase().includes("ART")){
		importArtfinding(artFinderURL, nodes).then((responses) => {
			if(master.getPath() != undefined){
				master.setPath(master.getPath()); //reload path
			}
		});

		//adds the more info button
		let element = document.getElementById("moreInfo");
		if(element === null){
			element = document.createElement("a");
			element.setAttribute("id", "moreInfo");
			document.body.appendChild(element);
		}
		element.setAttribute("type", "button");
		element.setAttribute("href", "https://en.wikipedia.org/wiki/Art");
		element.setAttribute("target", "_blank");
		element.innerHTML = "Click here to get more information about this piece of art";

		master.addOnUpdatePath((path) => {
			let isLink = false;
			nodes.getStringsById(path.endId).forEach(label => {
				console.log(label.toLowerCase());
				label = label.toLowerCase();
				if(label.includes("http")){
					element.innerHTML = label;
					element.setAttribute("href", label);
					isLink = true;
				}
				console.log(label);
			});
			if(!isLink){
				element.innerHTML = " ";
				element.setAttribute("href", "javascript:void(0)");
			}
		});
	}
});


function nextImage(){
    if(master.getPath() !== undefined){
        document.getElementById("image").src = master.getPath().nextImage();
    }
}
window.addEventListener("resize", function(){
    master.getCanvas().resize();
    if(master.getPath() !== undefined){
        master.getPath().draw(master.getCanvas());
    }
});