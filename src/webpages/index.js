import {
	getParamsFromURL
} from "../htmlInterface/qrCodes.js";
import {
	Canvas
} from "../htmlInterface/scaledCanvas.js";
import {
	Path
} from "../nodes/path.js";
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
    logger,
    driveGet,
	importManifest,
	importWayfindingDrive,
	importArtfindingDrive,
	importWayfinding,
	importArtfinding,
	importDataInto
} from "../getRequests/importData.js";
import {
	mapURL,
	masterSheetURL,
	artFinderURL
} from "../getRequests/urls.js";
import {
	NodeDB
} from "../dataFormatting/nodeDB.js";

let master = new Main();

//http://svgjs.com/
let svgDrawer = SVG('wrapper').size(1000, 1000).panZoom();
let svgMap = svgDrawer.image(mapURL);
svgMap.loaded(() => {
	console.time("Time to load (wayfinding)");
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

	
	
	
	
	
	//importDataInto(master);
    
	
	
	

	importWayfindingDrive("1Ngyyorf2qiSK407tT65_57vNJkgFYsH6", master).then((responses) => {
		console.timeEnd("Time to load (wayfinding)");
		if (params.get("mode").toUpperCase().includes("ART")) {
			console.time("Time to load (art)");
			
			//adds the more info button
			let info = new InfoElement("moreInfo");

			master.addOnUpdatePath((path) => {
				info.update(master);
			});
			
			importArtfindingDrive("1tb4tmPU6IvRerphft3qr8Irh01rfM13l", master).then((responses) => {
				console.timeEnd("Time to load (art)");
			});
		}
	});
});


function nextImage() {
	if (master.getPath() !== undefined) {
		document.getElementById("image").src = master.getPath().nextImage();
	}
}