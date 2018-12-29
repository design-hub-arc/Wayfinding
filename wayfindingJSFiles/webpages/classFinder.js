import {Main} from                    "../main.js";
import {TextBox} from                 "../htmlInterface/input.js";
import {get} from                     "../getRequests/importData.js";
import {formatResponse, CsvFile} from "../dataFormatting/csv.js";
import {ClassDB} from                 "../dataFormatting/databases.js";
import {classesURL} from              "../getRequests/urls.js";

var db = new ClassDB();
var master = new Main();
master.setClassDB(db);

get(classesURL, responseText =>{
    db.parseResponse(new CsvFile(responseText));
    master.setClassFinder(
        new TextBox("name box", "name hint"),
        new TextBox("instructor box", "instructor hint"),
        new TextBox("time box", "time hint"),
        "find class",
        "class result",
        "clear"
    );
});