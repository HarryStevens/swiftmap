import feature from "../../lib/topojson/feature";

import isString from "../utils/isString";
import isNumber from "../utils/isNumber";

// Draws point to a layer.
export default function drawPoints(radius, layer) {
  
  // Check for geospatial data.
  if (Object.keys(this.layers).length === 0) {
    console.error("You must pass TopoJSON data through swiftmap.points() before you can draw the map.")
    return;
  }

  // Check the type of the optional layer parameter.
  if (layer && typeof !isString(layer) && !isNumber(layer)) {
    console.warn("You must specify the layer as a string or a number. Layer will default to " + swiftmap.meta.last_layer);
    layer = swiftmap.meta.last_layer;
  }

  var r = radius || 2,
      projection = this.meta.projection.function,
      path = this.path,
      width = this.width,
      draw_layer = layer || this.meta.last_layer,
      curr_layer = this.layers[draw_layer];

  // Only append if the layer is new.
  if (!curr_layer.points) {
    this.layers[draw_layer].points = this.svg.selectAll(".point.point-" + draw_layer)
        .data(feature(curr_layer.data, curr_layer.object).features, function(d){ return d.properties.swiftmap.key; })
      .enter().append("circle")
        .attr("class", "point point-" + draw_layer)
        .attr("r", r + "px")
        .attr("cx", function(d) { return curr_layer.type == "polygons" ? path.centroid(d)[0] : projection(d.geometry.coordinates)[0]; })
        .attr("cy", function(d) { return curr_layer.type == "polygons" ? path.centroid(d)[1] : projection(d.geometry.coordinates)[1]; });
  }

  else {
    this.layers[draw_layer].points
        .attr("r", r);
  }

  return this;
}