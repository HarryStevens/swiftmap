import isString from "../utils/isString";

// Draws a polygons layer. This is a convenience method.
export default function draw(layer){
  // Check for geospatial data
  if (Object.keys(this.layers).length === 0) {
    console.error("You must pass TopoJSON data through swiftmap.polygons() before you can draw the map.")
    return;
  }

  // Check the type of the optional layer parameter.
  if (layer && !isString(layer)){
    console.warn("You must specify the layer as a string. The layer will default to " + this.meta.last_layer);
    layer = this.meta.last_layer;
  }

  // Determine which layer we are drawing on.
  var layer_name = layer || this.meta.last_layer;

  this.fit(layer_name).drawPolygons(layer_name).drawBoundary(layer_name);
  
  return this;
}