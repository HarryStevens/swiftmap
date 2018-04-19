// modules
import feature from "../../lib/swiftmap-topojson-bundler/feature";

// draws subunits
export default function drawSubunits() {
  
  // check for geospatial data
  if (this.meta.polygons[0] && this.meta.polygons[0].length == 0) {

    console.error("You must pass TopoJSON data through swiftmap.polygons() before you can draw subunits.");
    return;

  }

  var curr_polygons = this.meta.polygons[this.meta.last_layer]
  var data_object = curr_polygons.objects[Object.keys(curr_polygons.objects)[0]];

  this.layers[this.meta.last_layer].subunits = this.svg.selectAll(".subunit.subunit-" + this.meta.last_layer)
      .data(feature(curr_polygons, data_object).features, function(d){ return d.properties.key; })
    .enter().append("path")
      .attr("class", "subunit subunit-" + this.meta.last_layer)
      .attr("stroke", "#fff")
      .attr("stroke-width", "1px")
      .attr("fill", "#ccc")
      .attr("d", this.path);

  return this;
}
