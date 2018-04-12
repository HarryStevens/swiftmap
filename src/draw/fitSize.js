import * as topojson from "topojson-client";

// centers and zooms a projection
export default function fitSize() {  
  // check for geospatial data
  if (this.meta.geo.length == 0) {
  	console.error("You must pass TopoJSON data through swiftmap.geometry() before you can fit the map in its parent.")
  	return;
  }

  // update this property so we know whether this geospatial data has been fit to the parent
  this.meta.fitSize = true;

  var data_object = this.meta.geo.objects[Object.keys(this.meta.geo.objects)[0]];
  this.projection.fitSize([this.width, this.height], topojson.feature(this.meta.geo, data_object));
  return this;
}