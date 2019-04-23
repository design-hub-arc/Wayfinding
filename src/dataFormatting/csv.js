export function formatResponse(responseText){
	/*
	Converts the response from a csv file into a 
	two dimentional array.
	If it already in the correct format, leaves it in that format.
	*/
	let ret = [];
	
	try{
		let lines = (Array.isArray(responseText)) ? responseText : responseText.split(/\r?\n|\r/); //split on newline
		lines.forEach(line => {
			ret.push((Array.isArray(line)) ? line : line.split(","));
		});
	} catch(e){
		console.log(e.stack);
		console.log("response text is: ");
		console.log(responseText);
	}
	
	return ret;
}