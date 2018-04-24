// modules
import * as d3 from "../../lib/swiftmap-d3-bundler";
import feature from "../../lib/swiftmap-topojson-bundler/feature";

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
  
  // find the most recently fitted layer

  var layers = Object.keys(swiftmap.layers).map(function(d){ return swiftmap.layers[d]; });
  var fit_layer = layers.filter(function(d){ return d.fit; })[0];
  if (fit_layer) swiftmap.meta.projection.function.fitSize([swiftmap.width, swiftmap.height], feature(fit_layer.data, fit_layer.object));

  // scrope the projection and path
  var projection = swiftmap.meta.projection.function;
  var path = swiftmap.path;

  swiftmap.svg.selectAll("path").attr("d", path);
  swiftmap.svg.selectAll("text").attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; });
  swiftmap.svg.selectAll("circle.point")
      .attr("cx", function(d) { return projection(d.geometry.coordinates)[0]; })
      .attr("cy", function(d) { return projection(d.geometry.coordinates)[1]; });

  // if there are any bubbles, they need to be repositions
  var bubble_layers = Object.keys(swiftmap.layers)
    .map(function(layer){
      return swiftmap.layers[layer]
    })
    .filter(function(layer){
      return layer.bubbles;
    })

  if (bubble_layers.length > 0){

    bubble_layers.forEach(function(layer){

      d3.selectAll(".bubble.bubble-" + layer.name)
        .attr("cx", function(d){ return path.centroid(d)[0]; })
        .attr("cy", function(d){ return path.centroid(d)[1]; });

    });

  }
         
  return swiftmap;
}