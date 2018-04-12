export default function draw(){

  // check for geospatial data
  if (this.meta.geo.length == 0) {
    console.error("You must pass TopoJSON data through swiftmap.geometry() before you can draw the map.")
    return;
  }

  // basic drawing
  this.fit().drawSubunits().drawBoundary();

  return this;

}