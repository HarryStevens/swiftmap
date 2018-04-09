import * as topojson from "topojson-client";

// draws an outer boundary
export default function drawBoundary() {
	// check for geospatial data
	if (this.data.geo.length == 0) throw Error("You must pass TopoJSON data through swiftmap.geometry() before you can draw a boundary.");
	
  var data_object = this.data.geo.objects[Object.keys(this.data.geo.objects)[0]];
  
  this.boundary = this.svg.append("path")
    .datum(topojson.mesh(this.data.geo, data_object, function(a, b) { return a === b; }))
    .attr("d", this.path)
    .attr("class", "boundary")
    .attr("stroke", "#000")
    .attr("fill", "none");

  return this;
}