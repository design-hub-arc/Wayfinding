export class InfoElement{
	constructor(elementId){
		this.element = document.getElementById(elementId);
		if(this.element === null){
			this.element = document.createElement("ul");
			this.element.setAttribute("id", "moreInfo");
			document.body.appendChild(this.element);
		}
		this.element.setAttribute("type", "button");
		this.element.setAttribute("target", "_blank");
		this.element.innerHTML = " ";
		this.element.setAttribute("href", "javascript:void(0)");
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