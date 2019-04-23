export class InfoElement{
	constructor(elementId){
		this.element = document.getElementById(elementId);
		if(this.element === null){
			this.element = document.createElement("ul");
			this.element.setAttribute("id", elementId);
			document.body.appendChild(this.element);
		}
	}
	
	update(main){
		let nodes = main.getNodeDB();
		let path = main.getPath();
		
		while(this.element.hasChildNodes()){
			this.element.removeChild(this.element.childNodes[0]);
		}
		
		nodes.getStringsById(path.endId).forEach(label => {
			label = label.toLowerCase();
			if (label.includes("http")) {
				let ele = document.createElement("li");
				let a = document.createElement("a");
				a.innerHTML = label;
				a.setAttribute("href", label);
				a.setAttribute("target", "_blank");
				ele.appendChild(a);
				this.element.appendChild(ele);
			}
		});
	}
}