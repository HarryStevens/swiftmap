import * as topojson from "topojson-client";

// draws subunits
export default function drawSubunits() {
  var data_object = this.data.objects[Object.keys(this.data.objects)[0]];
  
  this.subunits = this.svg.selectAll(".subunit")
      .data(topojson.feature(this.data, data_object).features)
    .enter().append("path")
      .attr("class", "subunit")
      .attr("d", this.path)
      .attr("stroke", "#fff")
      .attr("stroke-width", "1px")
      .attr("fill", "#ccc");

  return this;
}