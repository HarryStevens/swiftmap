import feature from "../../lib/topojson/feature";
import isBoolean from "../utils/isBoolean";
import isNumber from "../utils/isNumber";
import isObject from "../utils/isObject";
import isString from "../utils/isString";

// Draws text labels to a layer.
export default function drawLabels(key, offset, layer) {
  // Check for geospatial data.
  if (Object.keys(this.layers).length === 0) {
    console.error("You must pass TopoJSON data through swiftmap.layerPoints() before you can draw labels.");
    return;
  }

  // Check for a key.
  if (!key){
    console.error("You must pass a key to drawLabels() so it knows which property to take text from.");
    return;
  }

  // Check the type of the optional layer parameter.
  if (layer && !isString(layer) && !isNumber(layer)) {
    console.warn("You must specify the layer as a string or a number. Layer will default to " + swiftmap.meta.last_layer + ".");
    layer = this.meta.last_layer;
  }

  var width = this.width,
      path = this.path,
      projection = this.meta.projection.function,
      layer_name = layer || this.meta.last_layer,
      layer = this.layers[layer_name];

  // Determine the offset.
  offset = !isBoolean(offset) ? false : offset;

  // TODO
  // Use the CSS selector of the labels to get the font size,
  // from which you can calculate the dy as fontSize * (3 / 8).

  // Only append if the layer is new.
  if (!this.layers[layer_name].labels){
    this.layers[layer_name].labels = this.svg.selectAll(".label.label-" + layer_name)
        .data(feature(layer.data, layer.object).features, function(d){ return d.properties.swiftmap.key; })
      .enter().append("text")
        .attr("class", "label label-" + layer_name)
        .attr("transform", function(d) { return "translate(" + getPoints(d) + ")"; })
        .attr("x", function(d) { return offset ? getPoints(d)[0] <= width / 2 ? -6 : 6 : 0; })
        .attr("font-size", ".8em")
        .attr("dy", ".3em")
        .attr("font-family", "sans-serif")
        .style("text-anchor", function(d) { return offset ? getPoints(d)[0] <= width / 2 ? "end" : "start" : "middle"; })
        .text(key);

    function getCoordinates(d){
      return projection(d.geometry.coordinates);
    }
    function getCentroid(d){
      return path.centroid(d);
    }
    function getPoints(d){
      return layer.type == "polygons" ? getCentroid(d) : getCoordinates(d);
    }
  }

  else {
    this.layers[layer_name].labels.text(key);
  }

  return this;
}
