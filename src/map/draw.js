export default function draw(layer){

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

  // basic drawing
  this.fit(draw_layer).drawSubunits(draw_layer).drawBoundary(draw_layer);

  return this;

}