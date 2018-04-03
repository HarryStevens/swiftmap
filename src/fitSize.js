import "d3-geo";
import * as topojson from "topojson-client";

// centers and zooms a projection
export default function fitSize() {  
  var data_object = this.data.objects[Object.keys(this.data.objects)[0]];
  this.projection.fitSize([this.width, this.height], topojson.feature(this.data, data_object));
  return this;
}