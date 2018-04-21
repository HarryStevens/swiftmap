import mesh from "../../lib/swiftmap-topojson-bundler/mesh";

// draws an outer boundary
export default function drawBoundary(layer) {
  
  // check for geospatial data
  if (Object.keys(this.layers).length === 0) {
    console.error("You must pass TopoJSON data through swiftmap.polygons() before you can draw the map.")
    return;
  }
  // type check the layer
  if (layer && typeof layer !== "string" && typeof layer !== "number") {
    console.warn("You must specify the layer as a string or a number. Layer will default to " + swiftmap.meta.last_layer);
    layer = swiftmap.meta.last_layer;
  }
  // Determine which layer we are drawing on.
  var draw_layer = layer || this.meta.last_layer;
  
  var curr_layer = this.layers[draw_layer];

  // only append the first time
  if (!curr_layer.boundary){
    
    this.layers[draw_layer].boundary = this.svg.append("path")
      .datum(mesh(curr_layer.data, curr_layer.object, function(a, b) { return a === b; }))
      .attr("d", this.path)
      .attr("class", "boundary boundary-" + draw_layer)
      .attr("stroke", "#000")
      .attr("fill", "none");

  } 

  // otherwise, update the path subsequently
  else {

    this.layers[draw_layer].boundary.attr("d", this.path);

  }

  return this;
}