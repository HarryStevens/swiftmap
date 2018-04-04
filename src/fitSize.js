import * as topojson from "topojson-client";

// centers and zooms a projection
export default function fitSize() {  
  var data_object = this.data.geo.objects[Object.keys(this.data.geo.objects)[0]];
  this.projection.fitSize([this.width, this.height], topojson.feature(this.data.geo, data_object));
  return this;
}