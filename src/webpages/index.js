import {getParamsFromURL} from                          "../htmlInterface/qrCodes.js";
import {Canvas} from                                 "../htmlInterface/scaledCanvas.js";
import {Path} from                                   "../nodes/path.js";
import {Main} from                                   "../main.js";
import {TextBox} from                                "../htmlInterface/input.js";
import {get, importMasterSheet, importWayfindingMasterSheet} from "../getRequests/importData.js";
import {formatResponse, CsvFile} from                "../dataFormatting/csv.js";
import {mapURL, masterSheetURL, artFinderURL} from   "../getRequests/urls.js";
import {NodeDB} from                                 "../dataFormatting/nodeDB.js";

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

        master.setNodeDB(nodes);
        masterCanvas.link(svgDrawer, document.getElementById("wrapper")
                    .getElementsByTagName("svg")[0]
                    .getElementsByTagName("image")[0]
                   );
        masterCanvas.resize();
        master.setCanvas(masterCanvas);
        
		get(masterSheetURL, console.log);
		
		
        importMasterSheet(masterSheetURL, (responses) => {
			//let pause = await importWayfindingMasterSheet(nodes);
            nodes.parseNodeData(responses.get("Node coordinates"));
            nodes.parseConnData(responses.get("Node connections"));
            masterCanvas.setCorners(nodes.getNode(-1).x, nodes.getNode(-1).y, nodes.getNode(-2).x, nodes.getNode(-2).y);

			nodes.parseNameToId(responses.get("buildings"));
			nodes.parseNameToId(responses.get("rooms"));
			
			
            nodes.parseImageResponse(new CsvFile(responses.get("images")));
            //nodes.parseClassResponse(new CsvFile(responses.get("class to room")));

            master.setInput(start, end);
            master.setPathButton("button");

            master.setPath(new Path(params.get("startID"), params.get("endID"), master));
            master.getPath().draw(master.getCanvas());
            console.timeEnd("Time to load");
			
			//nodes.prettyPrintStuffToId();
        },
		{
			ignore: ["map image", "classes", "class to room"]
		});
	
		console.log("Current mode is " + params.get("mode"));
		
		if(params.get("mode").toUpperCase().includes("ART")){
			//first, import the next data
			importMasterSheet(artFinderURL, (responses) => {
				nodes.parseNameToId(responses.get("labels"));
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
				});
				if(!isLink){
					element.innerHTML = " ";
					element.setAttribute("href", "javascript:void(0)");
				}
			});
		}
    }
);


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