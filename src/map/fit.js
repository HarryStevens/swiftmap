import feature from "../../lib/swiftmap-topojson-bundler/feature";

// centers and zooms a projection
export default function fit() {  
  // check for geospatial data
  if (this.meta.geo.length == 0) {
    console.error("You must pass TopoJSON data through swiftmap.geometry() before you can fit the map in its parent.")
    return;
  }

  // update this property so we know whether this geospatial data has been fit to the parent
  this.meta.fit = true;

  var data_object = this.meta.geo.objects[Object.keys(this.meta.geo.objects)[0]];
  this.meta.projection.function.fitSize([this.width, this.height], feature(this.meta.geo, data_object));
  return this;
}