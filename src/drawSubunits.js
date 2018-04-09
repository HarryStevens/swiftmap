// modules
import * as d3 from "../lib/swiftmap-d3-bundler";
import * as topojson from "topojson-client";

// draws subunits
export default function drawSubunits() {
  // check for geospatial data
  if (this.data.geo.length == 0) throw Error("You must pass TopoJSON data through swiftmap.geometry() before you can draw subunits.");

  var data_object = this.data.geo.objects[Object.keys(this.data.geo.objects)[0]];
  
  this.subunits = this.svg.selectAll(".subunit")
      .data(topojson.feature(this.data.geo, data_object).features, function(d, i){ return i; })
    .enter().append("path")
      .attr("class", "subunit")
      .attr("d", this.path)
      .attr("stroke", "#fff")
      .attr("stroke-width", "1px")
      .attr("fill", "#ccc");

  return this;
}
