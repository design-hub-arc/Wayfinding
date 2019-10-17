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


export const newline = /\r?\n|\r/;

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
export const VERSION_LOG_URL = "https://drive.google.com/export=download?id=1Q99ku0cMctu3kTN9OerjFsM9Aj-nW6H5";

//used for debugging
export const logger = {
	contents : [],
	add(msg){
		"use strict";
		this.contents.push(msg);
	},
	displayAll(){
		"use strict";
		for(let i = 0; i < this.contents.length; i++){
			console.log(this.contents[i]);
		}
	}
};


/*
Gets a file's data from the google drive.
fileId - a string, the id of the file in google drive.
*/
async function driveGet(fileId){
	//gapi is defined in https://apis.google.com/js/api.js.
	//if this doesn't work, make sure that the API has been loaded!
	return new Promise((resolve, reject)=>{
        gapi.client.drive.files.get({
            fileId: fileId
        }).then((metadata)=>{
            if(metadata.result.mimeType.includes("image")){
                resolve("https://drive.google.com/uc?export=download&id=" + metadata.result.id);
            } else {
                gapi.client.drive.files.get({
                    fileId: fileId,
                    alt: "media" //this means download the file's contents, not its metadata
                }).then((result)=> {
                    logger.add("Response from " + fileId + ":");
                    logger.add(result);
                    logger.add(result.body);
                    resolve(result.body);
                }).catch((error)=>{
                    throw new Error(error);
                });
            }
        }).catch((error)=>{
            throw new Error(error);
        });    
    });
    
    
    return gapi.client.drive.files.get({
		fileId: fileId,
		alt: "media" //this means download the file's contents, not its metadata
	}).then((result)=> {
		logger.add("Response from " + fileId + ":");
		logger.add(result);
		logger.add(result.body);
		return result.body;
	}).catch((error)=>{
		throw new Error(error);
	});
}


/*
@param fileIds : an array of strings, the ids of files to get

calls driveGet on each id, then resolves the promise, 
passing in all responses to a Map,
where the key is the id, and the value is the response text,
then resolves with that Map once each id's response has been obtained.
*/
async function driveSeqGets(fileIds){
    console.time("seq get");
    
    let responses = new Map();
    let promises = [];
    
    for(let i = 0; i < fileIds.length; i++){
        responses.set(fileIds[i], "No response from file ID " + fileIds[i]);
        promises.push(
            new Promise(async(resolve, reject)=>{
                let file = await driveGet(fileIds[i]);
                responses.set(fileIds[i], file);
                resolve(file);
            })
        );
    }
    await Promise.all(promises).then((r)=>console.log(r));
    console.timeEnd("seq get");
    return responses;
}


/*
 @param fileId : a string, the 
 id of the master url file
 on our google drive

 This performs a get request on the master url spreadsheet,
 then performs a get request on each url on the spreadsheet,
 then passes each URL into the callback function

 passes a Map, 
 with the keys being the identifier in the first column of the spreadsheet,
 and the value is the response text from performing a get request on the url after that identifier
 returning the Map
 */
async function importManifest(fileId){
	let responseText = await driveGet(fileId);
    let data = formatResponse(responseText);
    let fileIdToKey = new Map();
    /*
    since sequentialGets will return fileId-to-response,
    we need to provide an easier way to identify what each response is giving.
    since we are looking at key-to-fileId-to-response text,
    and sequentialGets gives us fileId-to-response,
    we can use this to get key-to-response text
    */

    for(let i = 1; i < data.length; i++){ 
        if (data[i].length >= 2 && data[i][1] !== ""){
            /*
            The data is a table, with the first column being a key,
            such as "node coordinates", "buildings", etc,

            and the second being the url linking to that resource
            */
            if(data[i][1].indexOf("id=") > -1){
                fileIdToKey.set(data[i][1].split("id=")[1], data[i][0]);
            } else {
                fileIdToKey.set(data[i][1], data[i][0]);
            }
        }
    }

    /*
    Convets the url-to-response result of seqGet
    to an easier to use key-to-response
     */
    let ret = new Map();
    let responses = await driveSeqGets(Array.from(fileIdToKey.keys()));
    responses.forEach((responseText, url) => {
        ret.set(fileIdToKey.get(url), responseText);
    });
    return ret;
}


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

This thing is pretty ugly, so I'll try to simplify it later

Returns the id of the most recently added manifest that works.

What it does:
1. Downloads the version log, then temporarily stores its data
2. Checks to see what mode of Wayfinding this is by looking at the URL, defaulting to wayfinding
3. Stores all the URLs in the column headed by that version
4. Starting at the end of URL list, goes backwards until it finds a version that works
5. If no valid manifests exist for the current version, check for the most recent wayfinding manifest.
6. If no valid manifests exist for wayfinding, something went VERY wrong.
*/
async function getLatestManifest(){
	//get the file id, not the URL
	let versionLogId = (VERSION_LOG_URL.indexOf("id=") === -1) ? VERSION_LOG_URL : VERSION_LOG_URL.split("id=")[1];
	
    let responseText = await driveGet(versionLogId);
    //get the contents of the version log
    let rows = responseText.split(newline);
    rows = rows.map((row)=>{
        return row.split(",");
    });

    //since QR code parameters converts to upper case, we need the headers to be uppercase as well
    rows[0] = rows[0].map((header)=>header.toUpperCase());

    //check the wayfinding mode
    //mode is an int, the index of the column it is contained in the version log
    let mode = rows[0].indexOf(new QrCodeParams().wayfindingMode);
    if(mode === -1){
        /*
        The mode is not present in the version log,
        so default to wayfinding.
        */
        mode = 0;
    }

    //keep goind until you hit a version that works
    let url;
    let id;

    async function recursiveCheck(row, col){
        /*
        Remember suffering through recursuion back in CISP 300?
        Yes, it does have valid uses.

        We need to check if an id in the version log works.
        This needs to be done using drive.files.get, which is asynchronus.
        Async + iteration = BAD.
        Instead, make each check call the next check as needed.
        */
        if(row === 0 && col === 0){
            console.error("No valid manifests exist. Something went very wrong.");
        } else if(row === 0){
            //couldn't find a valid URL in the current column
            console.log("No valid manifests were found for " + rows[row][col] + ". Switching to default wayfinding.");
            return await recursiveCheck(rows.length - 1, 0);
        } else if(rows[row][col] === ""){
            //skip blank
            return await recursiveCheck(row - 1, col);
        } else {
            //not blank, not header: we're ready to check.
            url = rows[row][col];
            id = (url.indexOf("id=") === -1) ? url : url.split("id=")[1];
            console.log("Checking " + id);
            if(await checkExists(id)){
                console.log("Yup, that works!");
                return id;
            } else {
                console.log("Nope. Check the next one.");
                return await recursiveCheck(row - 1, col);
            }
        }
    }

    return await recursiveCheck(rows.length - 1, mode);
}

/*
Imports all the data needed by the program into master
@param master : the Main object used by the program.
*/
export async function importDataInto(master){
    console.time("begin importing data");
	
    master.mode = new QrCodeParams().wayfindingMode;
    
    console.time("get latest manifest");
    let id = await getLatestManifest();
    console.timeEnd("get latest manifest");
    console.log("id is " + id);
    
    console.time("import manifest");
    let responses = await importManifest(id);
    console.timeEnd("import manifest");
    
    let nodeDB = master.getNodeDB();
    nodeDB.parseNodeData(responses.get("Node coordinates"));
    nodeDB.parseConnData(responses.get("Node connections"));
    nodeDB.parseNameToId(responses.get("labels"));

    console.time("set image");
    //setimage causing most of the lag
    await master.getCanvas().setImage(responses.get("map image"));
    console.timeEnd("set image");

    console.timeEnd("begin importing data");
    master.notifyImportDone();
    return responses;
}

//maybe use this to replace all of the ugly importing?
export class DataSet{
    constructor(){
        this.nodeCoordFile = null;
        this.nodeConnFile = null;
        this.labelFile = null;
        this.imageUrl = null;
    }
}