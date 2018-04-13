import mesh from "../../lib/swiftmap-topojson-bundler/mesh";

// draws an outer boundary
export default function drawBoundary() {
  // check for geospatial data
  if (this.meta.geo.length == 0) {
    console.error("You must pass TopoJSON data through swiftmap.geometry() before you can draw a boundary.");
    return;
  }
  
  var data_object = this.meta.geo.objects[Object.keys(this.meta.geo.objects)[0]];
  
  this.boundary = this.svg.append("path")
    .datum(mesh(this.meta.geo, data_object, function(a, b) { return a === b; }))
    .attr("d", this.path)
    .attr("class", "boundary")
    .attr("stroke", "#000")
    .attr("fill", "none");

  return this;
}