export default function draw(cl){

  // check for geospatial data
  if (Object.keys(this.layers).length === 0) {
    console.error("You must pass TopoJSON data through swiftmap.polygons() before you can draw the map.")
    return;
  }

  // basic drawing
  this.fit().drawSubunits().drawBoundary();

  return this;

}