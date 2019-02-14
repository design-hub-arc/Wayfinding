export class InfoElement{
	constructor(elementId){
		this.element = document.getElementById(elementId);
		if(this.element === null){
			this.element = document.createElement("a");
			this.element.setAttribute("id", "moreInfo");
			document.body.appendChild(this.element);
		}
		this.element.setAttribute("type", "button");
		this.element.setAttribute("target", "_blank");
		this.element.innerHTML = " ";
		this.element.setAttribute("href", "javascript:void(0)");
	}
	
	update(main){
		let isLink = false;
		let nodes = main.getNodeDB();
		let path = main.getPath();
		
		nodes.getStringsById(path.endId).forEach(label => {
			label = label.toLowerCase();
			if (label.includes("http")) {
				this.element.innerHTML = label;
				this.element.setAttribute("href", label);
				isLink = true;
			}
		});
		if (!isLink) {
			this.element.innerHTML = " ";
			this.element.setAttribute("href", "javascript:void(0)");
		}
	}
}