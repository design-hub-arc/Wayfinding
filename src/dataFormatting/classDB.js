/*
ClassDB is used by the Main class to store the data used by the class locator.
Once again, the HTML file does the populating

I would not advise reading this...

PLEASE. DATABASE FOR THIS!!!
*/
export class ClassDB{
	constructor(){
		//number is the five digit class number
		let headers = ["NUMBER", "NAME", "INSTRUCTOR", "ROOM", "MEETING TIME"];
		
		this.headers = [];
        this.rows = [];
        this.headerString = "";

        let h;
        for(let i = 0; i < headers.length; i++){
            h = headers[i].toString().toUpperCase();
            while(h.indexOf(" ") !== -1){
                h = h.replace(" ", "_");
            }
            this.headers.push(h);
            this.headerString += (h + " ");
            this[h] = i; //makes enum
        }

        this.sourceHeaders = [];
    }
	
	parseResponse(csvFile){
		"use strict";
		let data = csvFile.getNonHeaders();
		let classNumCol =   csvFile.indexOfCol(["CLASS #", "CLASS NUMBER"]);
		let subjCol =       csvFile.indexOfCol(["SUBJ CD", "SUBJECT"]);
		let numCol =        csvFile.indexOfCol(["CAT NBR", "NUMBER"]);
		let startTimeCol =  csvFile.indexOfCol(["BEG TIME", "START TIME"]);
		let endTimeCol =    csvFile.indexOfCol(["END TIME"]);
		let daysCol =       csvFile.indexOfCol(["DAYS"]);
        let buildingCol =   csvFile.indexOfCol(["BUILDING"]);
		let roomCol =       csvFile.indexOfCol(["ROOM"]);
		let instructorCol = csvFile.indexOfCol(["INSTRCTR", "INSTRUCTOR"]);
		
		let row;
		let name;
		//skip headers
		for(let i = 1; i < data.length; i++){
			row = data[i];
			try{
				//name = row[instructorCol.]
				this.rows.push([
					row[classNumCol],
					row[subjCol] + " " + row[numCol],
					row[instructorCol],
					row[buildingCol] + " " + row[roomCol],
					row[daysCol] + " " + row[startTimeCol] + " - " + row[endTimeCol]
				]);
			} catch(e){
				console.log(e.stack);
			}
		}
	}
	selectF(retCol, checkCol, callback){
		/*
        @param retCol : an int, the index of the column to return. Should be an enum value of this db
        @param checkCol : an int, the index of the column to compare to checkVal
        @param callback : a function which takes something as a parameter, and returns true or false
        @return an array of any single type, containing any values from retCol from rows
            where callback(checkCol) is true
        
        SELECT retCol FROM database WHERE callback(checkCol)
        */
        
        "use strict";
		let ret = [];
		try{
			//checking
			if(retCol >= this.headers.length){
				throw new RangeError("Invalid index for retCol");
			}
			if(checkCol >= this.headers.length){
				throw new RangeError("Invalid index for checkCol");
			}
			
			this.rows.forEach(row => {
				let check = row[checkCol];
				if(callback(check)){
					ret.push(row[retCol]);
				}
			});
		}catch(e){
			console.log(e.stack);
		}
		return ret;
	}
	select(retCol, checkCol, checkVal){
		/*
        @param retCol : an int, the index of the column to return. Should be an enum value of this db
        @param checkCol : an int, the index of the column to compare to checkVal
        @param checkVal : can be any type, the value to compare checkCol to
        @return an array of any single type, containing any values from retCol from rows
            where checkCol === checkVal
        
        SELECT retCol FROM database WHERE checkCol=checkVal;
		maybe add returning a new Database?
        */
        
        "use strict";
		checkVal = checkVal.toString().toUpperCase();
		return this.selectF(retCol, checkCol, data => (data.toString().toUpperCase() === checkVal));
	}
	getColumn(col){
		/*
        @param col : an int, an enum value for this, the column number to return
        @return an array containing each unique value from the given column
        SELECT DISTINCT columnName FROM database
        */
        
        "use strict";
		let ret = [];
		
		if(col >= this.headers.length){
			throw new RangeError("Invalid column");
		}
		
		let item;
		try{
			for(let i = 0; i < this.rows.length; i++){
				item = this.rows[i][col];
				if(ret.indexOf(item) === -1){
					ret.push(item);
				}
			}
		}catch(e){
			console.log(e.stack);
		}
		return ret;
	}
	getNumbersByName(className){
		"use strict";
		return this.select(this.NUMBER, this.NAME, className.toUpperCase());
	}
	getNumbersByInstructor(instructorName){
		"use strict";
		return this.select(this.NUMBER, this.INSTRUCTOR, instructorName.toUpperCase());
	}
	getNumbersByTime(time){
		"use strict";
		return this.select(this.NUMBER, this.MEETING_TIME, time.toUpperCase());
	}
	getAllClassNumbers(){
		"use strict";
		return this.getColumn(this.NUMBER);
	}
	getAllClassNames(){
		"use strict";
		return this.getColumn(this.NAME);
	}
	getAllInstructors(){
		"use strict";
		return this.getColumn(this.INSTRUCTOR);
	}
	getAllMeetingTimes(){
		"use strict";
		return this.getColumn(this.MEETING_TIME);
	}
	logAll(){
        /*
        prints the contents of the database
        SELECT * FROM this
        */
        
		"use strict";
		console.log(this.headerString);
		for(let i = 0; i < this.rows.length; i++){
			let row = "";
			for(let j = 0; j < this.rows[i].length; j++){
				row += this.rows[i][j];
				if(j !== this.rows[i].length - 1){
					row += ", ";
				}
			}
			console.log(row);
		}
	}
};