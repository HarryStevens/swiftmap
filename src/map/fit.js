import feature from "../../lib/topojson/feature";
import isString from "../utils/isString";
import isNumber from "../utils/isNumber";
import drawTiles from "./drawTiles";

// Sets a projection so a layer's outer boundary fits the dimensions of the map's parent.
export default function fit(layer) {  
  // Check for geospatial data.
  if (Object.keys(this.layers).length === 0) {
    console.error("You must pass TopoJSON data through swiftmap.layerPolygons() or swiftmap.layerPonts() before you can fit the layer to the map's parent.")
    return;
  }

  // for scoping issues
  var swiftmap = this;

  // type check the layer
  if (layer && !isString(layer) && !isNumber(layer)) {
    console.warn("You must specify the layer as a string or a number. Layer will default to " + swiftmap.meta.last_layer);
    layer = swiftmap.meta.last_layer;
  }

  // the layer
  var fit_layer = layer || swiftmap.meta.last_layer;

  // update this property so we know whether this geospatial data has been fit to the parent
  var layers = Object.keys(swiftmap.layers);
  layers.forEach(function(layer){
    swiftmap.layers[layer].fit = false;  
  });
  swiftmap.layers[fit_layer].fit = true;

  // set up the fit
  var curr_layer = swiftmap.layers[fit_layer];
  swiftmap.meta.projection.function.fitSize([swiftmap.width, swiftmap.height], feature(curr_layer.data, curr_layer.object));

  // make sure all classes are updated
  var projection = swiftmap.meta.projection.function;
  swiftmap.path.projection(swiftmap.meta.projection.function);
  var path = swiftmap.path;
  
  swiftmap.svg.selectAll("path").attr("d", path);
  swiftmap.svg.selectAll("text").attr("transform", function(d) { return "translate(" + getPoints(d) + ")"; });
  function getCoordinates(d){
    return projection(d.geometry.coordinates);
  }
  function getCentroid(d){
    return path.centroid(d);
  }
  function getPoints(d){
    return curr_layer.type == "polygons" ? getCentroid(d) : getCoordinates(d);
  }
  swiftmap.svg.selectAll("circle.point")
      .attr("cx", function(d) { return curr_layer.type == "polygons" ? path.centroid(d)[0] : projection(d.geometry.coordinates)[0]; })
      .attr("cy", function(d) { return curr_layer.type == "polygons" ? path.centroid(d)[1] : projection(d.geometry.coordinates)[1]; });

  // Fit the tiles, if any.
  if (swiftmap.meta.tiles) drawTiles(swiftmap);

  return swiftmap;
}