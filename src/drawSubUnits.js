import "d3-selection";
import * as topojson from "topojson-client";

// draws an outer boundary
export default function drawSubUnits() {
  var data_object = this.data.objects[Object.keys(this.data.objects)[0]];
  
  this.subUnits = this.svg.selectAll(".subunit")
      .data(topojson.feature(this.data, data_object).features)
    .enter().append("path")
      .attr("class", "subunit")
      .attr("d", this.path)
      .style("stroke", "#fff")
      .style("stroke-width", "1px")
      .style("fill", "#ccc");

  return this;
}