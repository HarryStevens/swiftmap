// modules
import feature from "../../lib/topojson/feature";

// draws polygons
export default function drawLabels(key, layer) {
  
  // check for geospatial data
  if (Object.keys(this.layers).length === 0) {
    console.error("You must pass TopoJSON data through swiftmap.polygons() before you can draw the map.");
    return;
  }
  // check for a key
  if (!key){
    console.error("You must pass a key to drawLabels() so it knows which property to take text from.");
  }
  // type check the layer
  if (layer && typeof layer !== "string" && typeof layer !== "number") {
    console.warn("You must specify the layer as a string or a number. Layer will default to " + swiftmap.meta.last_layer);
    layer = swiftmap.meta.last_layer;
  }
  // Determine which layer we are drawing on.
  var draw_layer = layer || this.meta.last_layer;

  // scope some variables
  var projection = this.meta.projection.function;
  var width = this.width;

  var curr_layer = this.layers[draw_layer];

  // TODO
  // Use the CSS selector of the labels to get the font size,
  // from which you can calculate the dy as fontSize * (3 / 8).
  if (!this.layers[draw_layer].labels){
    this.layers[draw_layer].labels = this.svg.selectAll(".label.label-" + draw_layer)
        .data(feature(curr_layer.data, curr_layer.object).features, function(d){ return d.properties.swiftmap.key; })
      .enter().append("text")
        .attr("class", "label label-" + draw_layer)
        .attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
        .attr("x", function(d) { return projection(d.geometry.coordinates)[0] <= width / 2 ? -6 : 6; })
        .attr("font-size", ".8em")
        .attr("dy", ".3em")
        .attr("font-family", "sans-serif")
        .style("text-anchor", function(d) { return projection(d.geometry.coordinates)[0] <= width / 2 ? "end" : "start"; })
        .text(key);
    }

    else {
      this.layers[draw_layer].labels.text(key);
    }
  

  return this;
}
