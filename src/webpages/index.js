import {getIDsFromURL} from                          "../htmlInterface/qrCodes.js";
import {Canvas} from                                 "../htmlInterface/scaledCanvas.js";
import {Path, PathFinder} from                       "../nodes/path.js";
import {Main} from                                   "../main.js";
import {TextBox} from                                "../htmlInterface/input.js";
import {get, sequentialGets, importMasterSheet} from "../getRequests/importData.js";
import {formatResponse, CsvFile} from                "../dataFormatting/csv.js";
import {mapURL, masterSheetURL} from                 "../getRequests/urls.js";
import {NodeDB} from                                 "../dataFormatting/nodeDB.js";

var master = new Main();

//http://svgjs.com/
var svgDrawer = SVG('wrapper').size(1000, 1000).panZoom();
var svgMap = svgDrawer.image(mapURL);
svgMap.loaded(
    function(){
        console.time("Time to load");
        // need to wait to invoke since we need image width
        var nodes = new NodeDB();
        var masterCanvas = new Canvas();
        var ids;
        var start = new TextBox("start box", "start hint");
        var end = new TextBox("end box", "end hint");

        master.setNodeDB(nodes);
        masterCanvas.link(svgDrawer, document.getElementById("wrapper")
                    .getElementsByTagName("svg")[0]
                    .getElementsByTagName("image")[0]
                   );
        masterCanvas.resize();
        master.setCanvas(masterCanvas);
        
		get(masterSheetURL, console.log);
		
        importMasterSheet(masterSheetURL, (responses) => {
            nodes.parseNodeData(formatResponse(responses.get("Node coordinates")));
            nodes.parseConnData(formatResponse(responses.get("Node connections")));
            masterCanvas.setCorners(nodes.getNode(-1).x, nodes.getNode(-1).y, nodes.getNode(-2).x, nodes.getNode(-2).y);

			nodes.parseNameToId(responses.get("buildings"));
			nodes.parseNameToId(responses.get("rooms"));
			
			
            nodes.parseImageResponse(new CsvFile(responses.get("images")));
            nodes.parseClassResponse(new CsvFile(responses.get("class to room")));

            master.setInput(start, end);
            master.setPathButton("button");

            ids = getIDsFromURL();
            master.setPath(new Path(ids[0], ids[1], master));
            master.getPath().draw(master.getCanvas());
            console.timeEnd("Time to load");
			
			//nodes.prettyPrintStuffToId();
        },
		{
			ignore: ["map image", "classes"]
		});
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