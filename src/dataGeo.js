// draw functions
import draw from "./draw";
import drawBoundary from "./drawBoundary";
import drawSubunits from "./drawSubunits";
import fitSize from "./fitSize";
import resize from "./resize";

export default function dataGeo(data, key){
	// if no data is passed, then this is a getter function
	if (!data) {
		return this.data.geo;
	}

	// if data is passed, then this is a setter function
	this.data.geo = data;

	// if a key is passed, add it to the class
	if (key) this.keys.geo = key;

	// now we can add the draw functions to the Class
	this.draw = draw;
  this.drawBoundary = drawBoundary;
  this.drawSubunits = drawSubunits;
  this.fitSize = fitSize;
  this.resize = resize;
  
  return this;
}