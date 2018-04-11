export default function colors(array){
	if (!array) return this.meta.colors;

	this.meta.colors = array;

	return this;
}