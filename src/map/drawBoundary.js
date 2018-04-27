import mesh from "../../lib/topojson/mesh";
import isString from "../utils/isString";
import isNumber from "../utils/isNumber";

// Draws an outer boundary to a layer.
export default function drawBoundary(layer) {
  // Check for geospatial data.
  if (Object.keys(this.layers).length === 0) {
    console.error("You must pass TopoJSON data through swiftmap.layerolygons() before you can draw the layer's boundary.")
    return;
  }

  // Check the type of the optional layer parameter.
  if (layer && !isString(layer) && !isNumber(layer)) {
    console.warn("You must specify the layer as a string or a number. Layer will default to " + swiftmap.meta.last_layer);
    layer = this.meta.last_layer;
  }

  var layer_name = layer || this.meta.last_layer,
      layer = this.layers[layer_name];

  // Only append the first time.
  if (!layer.boundary){   
    this.layers[layer_name].boundary = this.svg.append("path")
      .datum(mesh(layer.data, layer.object, function(a, b) { return a === b; }))
      .attr("d", this.path)
      .attr("class", "boundary boundary-" + layer_name)
      .attr("stroke", "#000")
      .attr("fill", "none");
  } 

  else {
    this.layers[layer_name].boundary.attr("d", this.path);
  }

  return this;
}