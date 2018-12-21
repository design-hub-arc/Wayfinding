import {Main} from "./main.js";
import {TextBox} from "./input.js";
import {get} from "./importData.js";
import {formatResponse, CsvFile} from "./csv.js";
import {ClassDB} from "./databases.js";
import {classesURL} from "./urls.js";

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