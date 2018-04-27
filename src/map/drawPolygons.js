import feature from "../../lib/topojson/feature";
import isString from "../utils/isString";
import isNumber from "../utils/isNumber";

// Draws polygons to a layer.
export default function drawPolygons(layer) {
  // Check for geospatial data.
  if (Object.keys(this.layers).length === 0) {
    console.error("You must pass TopoJSON data through swiftmap.layerPolygons() before you can draw points.")
    return;
  }

  // Check the type of the optional layer parameter.
  if (layer && !isString(layer) && !isNumber(layer)) {
    console.warn("You must specify the layer as a string or a number. Layer will default to " + swiftmap.meta.last_layer);
    layer = swiftmap.meta.last_layer;
  }

  var layer_name = layer || this.meta.last_layer,
      layer = this.layers[layer_name];

  // Only append if the layer is new.
  if (!layer.polygons) {
    this.layers[layer_name].polygons = this.svg.selectAll(".polygon.polygon-" + layer_name)
        .data(feature(layer.data, layer.object).features, function(d){ return d.properties.swiftmap.key; })
      .enter().append("path")
        .attr("class", "polygon polygon-" + layer_name)
        .attr("stroke", "#fff")
        .attr("stroke-width", "1px")
        .attr("fill", "#ccc")
        .attr("d", this.path);  
  }

  else {
    this.layers[layer_name].polygons
        .attr("d", this.path);
  }
  
  return this;
}