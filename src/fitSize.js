import * as topojson from "topojson-client";

// centers and zooms a projection
export default function fitSize() {  
	// check for geospatial data
  if (this.data.geo.length == 0) throw Error("You must pass TopoJSON data through swiftmap.geometry() before you can fit the map in its parent.");

  var data_object = this.data.geo.objects[Object.keys(this.data.geo.objects)[0]];
  this.projection.fitSize([this.width, this.height], topojson.feature(this.data.geo, data_object));
  return this;
}