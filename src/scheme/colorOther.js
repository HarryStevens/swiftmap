export default function colorOther(color){
  if (!color) return this.meta.colorOther;

  // type checking
  if (typeof color !== "string"){
  	console.warn("The argument passed to scheme.colorOther() must be a string. The color will not be updated, and defaults to '#ccc'.");
  } else {
  	this.meta.colorOther = color;
  }

  return this;
}