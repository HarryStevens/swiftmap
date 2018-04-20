import mesh from "../../lib/swiftmap-topojson-bundler/mesh";

// draws an outer boundary
export default function drawBoundary() {
  
  // check for geospatial data
  if (Object.keys(this.layers).length === 0) {
    console.error("You must pass TopoJSON data through swiftmap.polygons() before you can draw the map.")
    return;
  }
  
  var curr_layer = this.layers[this.meta.last_layer];

  // only append the first time
  if (!curr_layer.boundary){
    
    this.layers[this.meta.last_layer].boundary = this.svg.append("path")
      .datum(mesh(curr_layer.data, curr_layer.object, function(a, b) { return a === b; }))
      .attr("d", this.path)
      .attr("class", "boundary boundary-" + this.meta.last_layer)
      .attr("stroke", "#000")
      .attr("fill", "none");

  } 

  // otherwise, update the path subsequently
  else {

    this.layers[this.meta.last_layer].boundary.attr("d", this.path);

  }

  return this;
}