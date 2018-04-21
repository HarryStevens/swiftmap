// modules
import * as d3 from "../../lib/swiftmap-d3-bundler";

// utility functions
import keepNumber from "../utils/keepNumber";

// resizes the map
export default function resize() {

  // scoping issues
  var swiftmap = this;

  // size attributes
  swiftmap.width = swiftmap.parent == "body" ? window.innerWidth :
    +keepNumber(d3.select(swiftmap.parent).style("width"));
  swiftmap.height = swiftmap.parent == "body" ? window.innerHeight :
    +keepNumber(d3.select(swiftmap.parent).style("height"));
  swiftmap.svg.attr("width", swiftmap.width).attr("height", swiftmap.height);
  
  // if any layer has been fit, fit to that layer
  var layers = Object.keys(swiftmap.layers).map(function(d){ return swiftmap.layers[d]; });
  var fit_layer = layers.filter(function(d){ return d.fit; })[0];
  if (fit_layer) swiftmap.fit(fit_layer.name);

  // scrope the projection and path
  var projection = swiftmap.meta.projection.function;
  var path = swiftmap.path;

  swiftmap.svg.selectAll("path").attr("d", path);
  swiftmap.svg.selectAll("text").attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; });
  swiftmap.svg.selectAll("circle.point")
      .attr("cx", function(d) { return projection(d.geometry.coordinates)[0]; })
      .attr("cy", function(d) { return projection(d.geometry.coordinates)[1]; });

  // need to reposition bubbles
  if (swiftmap.meta.bubbles) swiftmap.drawScheme({constructor: {name: "SchemeBubble"}, skipRadius: true}, 0, fit_layer ? fit_layer.name : null);
         
  return swiftmap;
}