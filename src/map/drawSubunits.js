// modules
import feature from "../../lib/swiftmap-topojson-bundler/feature";

// draws subunits
export default function drawSubunits() {
  // check for geospatial data
  if (this.meta.geo.length == 0) {
    console.error("You must pass TopoJSON data through swiftmap.geometry() before you can draw subunits.");
    return;
  }

  var data_object = this.meta.geo.objects[Object.keys(this.meta.geo.objects)[0]];
  
  this.subunits = this.svg.selectAll(".subunit")
      .data(feature(this.meta.geo, data_object).features)
  
  this.subunits.enter().append("path")
      .attr("class", "subunit")
      .attr("stroke", "#fff")
      .attr("stroke-width", "1px")
      .attr("fill", "#ccc")
    .merge(this.subunits)
      .attr("d", this.path);

  return this;
}
