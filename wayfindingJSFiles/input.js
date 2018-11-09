/*
used to take input from the user

first, accesses or creates two HTML elements,
one used for user input,
the second displays the closest match to what the user entered (see below)

after creating a TextBox, you will need to populate its option by calling...
textBox.addOptions(anArray);

whenever the user types in the text box, 
the result element will search through options for the closest match to what the user entered,
then sets its text to that match.
*/

//@import closestMatch from utilities.js

function TextBox(textBoxId, resultElementId){
	/*
	@param textBoxId : a string, the id of an <input> HTML element with type="text"
	@param resultElementId : a string, the id of any HTML element whose inner HTML 
	will enter the option closest to the user's input
	
	if either of the aforementioned elements don't exist, will create them instead
	*/
	"use strict";
	this.box = document.getElementById(textBoxId);
	this.resultElement = document.getElementById(resultElementId);
	
	if(this.box === null){
		this.box = document.createElement("input");
		this.box.setAttribute("type", "text");
		this.box.setAttribute("id", textBoxId);
		document.body.appendChild(this.box);
	}
	if(this.resultElement === null){
		this.resultElement = document.createElement("div");
		this.resultElement.setAttribute("id", resultElementId);
		document.body.appendChild(this.resultElement);
	}
	
	this.options = ["your result will appear here!"];
	this.resultElement.innerHTML = "your result will appear here!";
	
	this.box.oninput = this.updateResult.bind(this);
}
TextBox.prototype = {
	addOptions : function(options){
		/*
		@param options : an array of strings
		*/
		"use strict";
		var b = this;
		options.forEach(function(option){
			if(option){
				b.options.push((option.toString().toUpperCase()));
			}
		});
	},
	updateResult : function(){
		// makes the result search for the closest match in options to what the user's entered
		"use strict";
		this.resultElement.innerHTML = closestMatch(this.box.value, this.options);
	},
	isValid : function(){
		//legal input was entered
		"use strict";
		//want to make sure the closest match is both in the options, and not the default option
		return (this.options.indexOf(this.resultElement.innerHTML.toUpperCase()) > 0);
	},
	setInput : function(str){
		//@param str : a string, what to put in the input box
		//basically makes the program act as the user, typing str in the box
		"use strict";
		this.box.value = str;
		this.box.oninput();
	},
	getResult : function(){
		/*
		@return : a string, the closest match to what the user inputted
		*/
		"use strict";
		return this.resultElement.innerHTML;
	}
};