export default function draw(){

	// check for geospatial data
	if (this.data.geo.length == 0) throw Error("You must pass TopoJSON data through swiftmap.geometry() before you can draw the map.");

	// basic drawing
  this.fitSize().drawSubunits().drawBoundary();

  return this;
}