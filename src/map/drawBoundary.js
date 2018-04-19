import mesh from "../../lib/swiftmap-topojson-bundler/mesh";

// draws an outer boundary
export default function drawBoundary() {
  
  // check for geospatial data
  if (this.meta.polygons[0] && this.meta.polygons[0].length == 0) {

    console.error("You must pass TopoJSON data through swiftmap.polygons() before you can draw a boundary.");
    return;

  }
  
  var curr_polygons = this.meta.polygons[this.meta.last_layer]
  var data_object = curr_polygons.objects[Object.keys(curr_polygons.objects)[0]];
  
  // only append the first time
  if (!this.layers[this.meta.last_layer].boundary){
    
    this.layers[this.meta.last_layer].boundary = this.svg.append("path")
      .datum(mesh(curr_polygons, data_object, function(a, b) { return a === b; }))
      .attr("d", this.path)
      .attr("class", "boundary boundary-" + this.meta.last_layer)
      .attr("stroke", "#000")
      .attr("fill", "none");

  } 

  // otherwise, update the path subsequently
  else {

    this[cl].boundary.attr("d", this.path);

  }

  return this;
}