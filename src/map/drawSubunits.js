// modules
import feature from "../../lib/swiftmap-topojson-bundler/feature";

// draws subunits
export default function drawSubunits() {
  
  // check for geospatial data
  if (Object.keys(this.layers).length === 0) {
    console.error("You must pass TopoJSON data through swiftmap.polygons() before you can draw the map.")
    return;
  }

  var curr_layer = this.layers[this.meta.last_layer];

  this.layers[this.meta.last_layer].subunits = this.svg.selectAll(".subunit.subunit-" + this.meta.last_layer)
      .data(feature(curr_layer.data, curr_layer.object).features, function(d){ return d.properties.key; })
    .enter().append("path")
      .attr("class", "subunit subunit-" + this.meta.last_layer)
      .attr("stroke", "#fff")
      .attr("stroke-width", "1px")
      .attr("fill", "#ccc")
      .attr("d", this.path);

  return this;
}
