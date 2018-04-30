import feature from "../../lib/topojson/feature";
import isString from "../utils/isString";
import isNumber from "../utils/isNumber";
import pointsUtility from "./pointsUtility"

// Draws points to a layer.
export default function drawPoints(radius, layer) {
  var swiftmap = this,
      projection = swiftmap.meta.projection.function,
      path = swiftmap.path;

  // Check for geospatial data.
  if (Object.keys(swiftmap.layers).length === 0) {
    console.error("You must pass TopoJSON data through swiftmap.layerPoints() or swiftmap.layerPolygons() before you can draw polygons.")
    return;
  }

  // Check the type of the optional radius parameter.
  if (radius && !isNumber(radius)){
    console.warn("You must specify the radius as a number. Radius will default to 2.");
    radius = 2;
  }
  var r = radius || 2;

  // Check the type of the optional layer parameter.
  if (layer && !isString(layer) && !isNumber(layer)) {
    console.warn("You must specify the layer as a string or a number. Layer will default to " + swiftmap.meta.last_layer + ".");
    layer = swiftmap.meta.last_layer;
  }
  var layer_name = layer || swiftmap.meta.last_layer,
      layer = swiftmap.layers[layer_name];

  // Only append if the layer is new.
  if (!layer.points) {
    swiftmap.layers[layer_name].points = swiftmap.svg.selectAll(".point.point-" + layer_name)
        .data(feature(layer.data, layer.object).features, function(d){ return d.properties.swiftmap.key; })
      .enter().append("circle")
        .attr("class", "point point-" + layer_name)
        .attr("r", r + "px")
        .attr("cx", function(d) { return pointsUtility(swiftmap, d)[0]; })
        .attr("cy", function(d) { return pointsUtility(swiftmap, d)[1]; });
  }

  else {
    swiftmap.layers[layer_name].points
        .attr("r", r);
  }

  return swiftmap;
}