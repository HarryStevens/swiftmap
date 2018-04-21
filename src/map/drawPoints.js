// modules
import feature from "../../lib/swiftmap-topojson-bundler/feature";

// draws subunits
export default function drawPoints(radius, duration, layer) {
  
  // check for geospatial data
  if (Object.keys(this.layers).length === 0) {
    console.error("You must pass TopoJSON data through swiftmap.polygons() before you can draw the map.")
    return;
  }
  // type check the layer
  if (layer && typeof layer !== "string"){
    console.warn("You must specify the layer as a string. The layer will default to " + this.meta.last_layer);
    layer = this.meta.last_layer;
  }
  // Determine which layer we are drawing on.
  var draw_layer = layer || this.meta.last_layer;

  // calc the radius
  var r = radius || 2;

  // add the radius to the data, for use in other functions and with multiple layers
  this.layers[draw_layer].object.geometries.forEach(function(d){
    d.properties.swiftmap = d.properties.swiftmap || {};
    d.properties.swiftmap.pointRadius = r;
    return d;
  });

  // scope some variables
  var projection = this.meta.projection.function;
  var width = this.width;

  var curr_layer = this.layers[draw_layer];

  this.layers[draw_layer].points = this.svg.selectAll(".point.point-" + draw_layer)
      .data(feature(curr_layer.data, curr_layer.object).features, function(d){ return d.properties.swiftmap.key; })
  
  this.layers[draw_layer].points.transition().duration(duration)
      .attr("r", function(d){ return d.properties.swiftmap.pointRadius; });

  this.layers[draw_layer].points.enter().append("circle")
      .attr("class", "point point-" + draw_layer)
      .attr("cx", function(d) { return projection(d.geometry.coordinates)[0]; })
      .attr("cy", function(d) { return projection(d.geometry.coordinates)[1]; })
      .attr("r", r);
      
  return this;
}
