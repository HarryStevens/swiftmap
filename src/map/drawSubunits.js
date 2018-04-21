// modules
import feature from "../../lib/swiftmap-topojson-bundler/feature";

// draws subunits
export default function drawSubunits(layer) {
  
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

  this.layers[draw_layer].subunits = this.svg.selectAll(".subunit.subunit-" + draw_layer)
      .data(feature(curr_layer.data, curr_layer.object).features, function(d){ return d.properties.swiftmap.key; })
  
  this.layers[draw_layer].subunits
      .attr("d", this.path);

  this.layers[draw_layer].subunits.enter().append("path")
      .attr("class", "subunit subunit-" + draw_layer)
      .attr("stroke", "#fff")
      .attr("stroke-width", "1px")
      .attr("fill", "#ccc")
      .attr("d", this.path);

  return this;
}
