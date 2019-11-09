/*
Provides functions which are used to download the data the program 
needs to find paths.

We currently store the data on the google drive as csv and png files,
but we will soon (hopefully) store everything on a database soon.

We have a file, "versions.csv" on the google drive. The Node Manager 
appends each of its exports to this file.

If you really want to know how this works, scroll to the bottom, and work your way up;
each of the functions has their own documentation
*/

import {formatResponse, CsvFile} from "../dataFormatting/csv.js";
import {QrCodeParams}            from "../htmlInterface/qrCodes.js";


const NEWLINE = /\r?\n|\r/;

/*
The version log is used to keep track of data exports from the Node Manager.
This allows the program to automatically update to use the latest data we export
and we don't need to do ANYTHING:
no changing URLs,
no changing files,
NOTHING.

With that said, if this gets broken, everything stops working.
Not good.
*/
const VERSION_LOG_URL = "https://drive.google.com/export=download?id=1Q99ku0cMctu3kTN9OerjFsM9Aj-nW6H5";

//used for debugging
const LOGGER = {
	contents : [],
	add(msg){
		this.contents.push(msg);
	},
	displayAll(){
		for(let i = 0; i < this.contents.length; i++){
			console.log(this.contents[i]);
		}
	}
};



//returns whether or not a file with the given ID exists in the google drive
async function checkExists(id){
	return gapi.client.drive.files.get({
		fileId: id
	}).then(()=>{
		return true;
	}).catch(()=>{
		return false;
	});
}

/*
Gets a file's data from the google drive.
fileId - a string, the id of the file in google drive.
*/
async function driveGet(fileId){
	//gapi is defined in https://apis.google.com/js/api.js.
	//if this doesn't work, make sure that the API has been loaded!
    let metadata = await gapi.client.drive.files.get({fileId: fileId});
    let ret;
    if(metadata.result.mimeType.includes("image")){
        ret = "https://drive.google.com/uc?export=download&id=" + metadata.result.id;
    } else {
        let result = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: "media" //this means download the file's contents, not its metadata
        });
        LOGGER.add("Response from " + fileId + ":");
        LOGGER.add(result);
        LOGGER.add(result.body);
        ret = result.body;
    }
    return ret;
}



/*
 * Downloads the manifest with the given ID.
 * 
 * A manifest lists all the different files used by a version of Wayfinding.
 * this function downloads each file referenced in that manifest, returning a Map:
 * (*) each key in the Map is the purpose of the file, and can have the following values:
 *      - "Node coordinates"
 *      - "Node connections"
 *      - "labels"
 *      - "map image"
 * (*) the value will be the text of the file referenced in the manifest, 
 *      for example, map.get("Node coordinates") returns the node coordinate file associated with the manifest
 *      the only exception is the map image, which is stored in the Map as a link to the image
 */
async function importManifest(manifestFileId){
    let manifestText = await driveGet(manifestFileId);
    let data = formatResponse(manifestText);
    let keyToFileText = new Map();
    let promises = [];
    
    let key;
    let fileId;
    
    //need this to preserve values of fileId and key despite iteration
    async function getFile(fileId, key){
        let file = await driveGet(fileId);
        keyToFileText.set(key, file);
        return file;
    }
    //          avoid the header
    for(let i = 1; i < data.length; i++){ 
        if (data[i].length >= 2 && data[i][1] !== ""){
            /*
            The data is a table, with the first column being a key,
            such as "node coordinates", "buildings", etc,

            and the second being the url linking to that resource
            */
            
            key = data[i][0];
            //make sure to get just the file id
            fileId = (data[i][1].indexOf("id=") === -1) ? data[i][1] : data[i][1].split("id=")[1];
            
            keyToFileText.set(key, "No response from file ID " + fileId);
            promises.push(getFile(fileId, key));
        }
    }
    
    await Promise.all(promises).then((r)=>{
        LOGGER.add(r);
    });
    
    return keyToFileText;
}



/*
Returns the id of the most recently added manifest that works.

What it does:
1. Downloads the version log, then temporarily stores its data
2. Checks to see what mode of Wayfinding this is by looking at the URL, defaulting to wayfinding
3. Stores all the URLs in the column headed by that version
4. Starting at the end of URL list, goes backwards until it finds a version that works
5. If no valid manifests exist for the current version, check for the most recent wayfinding manifest.
6. If no valid manifests exist for wayfinding, something went VERY wrong, and throws an Error.
*/
async function getLatestManifest(){
	//get the file id, not the URL
	let versionLogId = (VERSION_LOG_URL.indexOf("id=") === -1) ? VERSION_LOG_URL : VERSION_LOG_URL.split("id=")[1];
	
    //get the contents of the version log
    let response = await driveGet(versionLogId);
    let rows = response.split(NEWLINE).map((row)=>row.split(","));
    //since QR code parameters converts to upper case, we need the headers to be uppercase as well
    rows[0] = rows[0].map((header)=>header.toUpperCase());

    //check the wayfinding mode
    //mode is an int, the index of the column it is contained in the version log
    let wayfindingMode = new QrCodeParams().wayfindingMode;
    let mode = rows[0].indexOf(wayfindingMode);
    if(mode === -1){
        /*
        The mode is not present in the version log,
        so default to wayfinding.
        */
        mode = 0;
    }

    let url;
    let id;
    
    console.log("Finding the latest manifest...");
    //rows.forEach((row)=>console.log(row.join(", ")));
    
    /*
    Since the most recent manifest for each version
    is appended to the bottom of its column, the CSV
    file works like an upside-down stack, starting from
    the top, and growing downward. We want the latest manifest,
    so we have to start at the bottom, and work our way up until
    we hit the header.
     */
    let currRow = rows.length - 1;
    let currCol = mode;
    let ret = null;
    while(ret === null){
        if(rows[currRow][currCol] === ""){
            //skip blank cells
            currRow--;
        } else {
            url = rows[currRow][currCol];
            id = (url.indexOf("id=") === -1) ? url : url.split("id=")[1];
            console.log("Checking if " + id + " exists");
            if(await checkExists(id)){
                console.log("yes, the file " + id + " exists.");
                ret = id;
            } else {
                console.log("no, the file " + id + " does not exist");
                currRow--;
            }
        }
        /*
        If we make it to the header, that means
        there are no valid exports for the given mode.
        If we aren't checking for Wayfinding exports,
        switch to checking that column, and start back 
        at the bottom.
        */
        if(currRow === 0 && currCol !== 0){
            console.log("No valid manifests exist for the given mode. Defaulting to Wayfinding");
            currCol = 0; //check for Wayfinding exports...
            currRow = rows.length - 1; //...go back to the bottom.
        }else if(currRow === 0 && currCol === 0){
            throw new Error("Something is wrong with the manifest: no valid exports exist.");
        }
    }
    return ret;
}

/*
Imports all the data needed by the program into master
@param master : the App object used by the program.
*/
async function importDataInto(master){
    console.time("begin importing data");
    
    console.time("get latest manifest");
    let id = await getLatestManifest();
    console.timeEnd("get latest manifest");
    console.log("id is " + id);
    
    console.time("import manifest");
    let responses = await importManifest(id);
    console.timeEnd("import manifest");
    
    await master.notifyImportDone(responses);
    console.timeEnd("begin importing data");
    
    return responses;
}

//maybe use this to replace all of the ugly importing?
/*
class DataSet{
    constructor(){
        this.nodeCoordFile = null;
        this.nodeConnFile = null;
        this.labelFile = null;
        this.imageUrl = null;
    }
}
*/
export {
    NEWLINE,
    VERSION_LOG_URL,
    LOGGER,
    importDataInto
};