import "d3-selection";
import * as topojson from "topojson-client";

// draws an outer boundary
export default function drawBoundary() {
	var data_object = this.data.objects[Object.keys(this.data.objects)[0]];
  var boundary = topojson.mesh(this.data, data_object, function(a, b) { return a === b; });
  
  this.boundary = this.svg.append("path")
    .datum(boundary)
    .attr("d", this.path)
    .attr("class", "boundary")
    .attr("stroke", "#000")
    .attr("fill", "none");

  return this;
}