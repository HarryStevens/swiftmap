import feature from "../../lib/swiftmap-topojson-bundler/feature";

// centers and zooms a projection
export default function fit(layer) {  
  
  // check for geospatial data
  if (Object.keys(this.layers).length === 0) {
    console.error("You must pass TopoJSON data through swiftmap.polygons() before you can draw the map.")
    return;
  }

  // for scoping issues
  var swiftmap = this;

  // type check the layer
  if (layer && typeof layer !== "string") {
    console.warn("You must specify the layer to fit as a string. Layer will default to " + swiftmap.meta.last_layer);
    layer = swiftmap.meta.last_layer;
  }

  // the layer to fit
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
  var path = swiftmap.path.projection(swiftmap.meta.projection.function);
  
  swiftmap.svg.selectAll("path").attr("d", path);
  swiftmap.svg.selectAll("text").attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; });
  swiftmap.svg.selectAll("circle.point")
      .attr("cx", function(d) { return projection(d.geometry.coordinates)[0]; })
      .attr("cy", function(d) { return projection(d.geometry.coordinates)[1]; });

  return swiftmap;
}