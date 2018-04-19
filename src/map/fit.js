import feature from "../../lib/swiftmap-topojson-bundler/feature";

// centers and zooms a projection
export default function fit(layer) {  
  
  // check for geospatial data
  if (this.meta.polygons[0] && this.meta.polygons[0].length == 0) {

    console.error("You must pass TopoJSON data through swiftmap.polygons() before you can fit the map to its container.");
    return;

  }

  // for scoping issues
  var swiftmap = this;

  // type check the layer
  if (layer && typeof layer !== "string") {
    console.warn("You must specify that layer to fit as a string. Layer will default to " + swiftmap.meta.last_layer);
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
  var curr_polygons = swiftmap.meta.polygons[fit_layer]
  var data_object = curr_polygons.objects[Object.keys(curr_polygons.objects)[0]];
  swiftmap.meta.projection.function.fitSize([swiftmap.width, swiftmap.height], feature(curr_polygons, data_object));

  // make sure all classes are updated
  var path = swiftmap.path.projection(swiftmap.meta.projection.function);
  
  swiftmap.svg.selectAll("path").attr("d", path);
  swiftmap.svg.selectAll("text").attr("transform", function(d) { return "translate(" + projection(d.polygons.coordinates) + ")"; });

  return swiftmap;
}