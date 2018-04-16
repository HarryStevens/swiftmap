// modules
import feature from "../../lib/swiftmap-topojson-bundler/feature";

// utility functions
import extent from "../utils/extent";

// draws an outer boundary
export default function drawBubbles(scheme, duration) {
  // check for geospatial data
  if (this.meta.geo.length == 0) {
    console.error("You must pass TopoJSON data through swiftmap.geometry() before you can draw bubbles.");
    return;
  }

  // set this to true for resizing operations
  this.meta.bubbles = true;
  
  // store some data in variables
  var data_object = this.meta.geo.objects[Object.keys(this.meta.geo.objects)[0]];
  var path = this.path;

  this.bubbles = this.svg.selectAll(".bubble")
      .data(feature(this.meta.geo, data_object).features, function(d){ return d.properties.key; });

  this.bubbles.transition().duration(duration)
      .attr("cx", function(d){ return path.centroid(d)[0]; })
      .attr("cy", function(d){ return path.centroid(d)[1]; })

  if (scheme){
    this.bubbles.transition().duration(duration)
        .attr("r", radius);
  }

  this.bubbles.enter().append("circle")
      .attr("fill-opacity", .75)
      .attr("stroke", "#000")
      .attr("cx", function(d){ return path.centroid(d)[0]; })
      .attr("cy", function(d){ return path.centroid(d)[1]; })
      .attr("class", "bubble")
    .transition().duration(duration)
      .attr("r", radius);

  function radius(d){
    // get the matching datum
    var match = scheme.meta.tab
      .filter(function(row){
        return row.key == d.properties.key;
      })
      .map(scheme.meta.values);

    // if no match, no bubble
    if (match.length == 0) return 0;

    return scale(match[0]);    
  }

    // create a scale to calculate the appropriate radius
  function scale(datum){
    var scheme_domain_extent = extent(scheme.meta.tab.map(scheme.meta.values));
    var scheme_range_extent = scheme.meta.radiusRange;

    // where does the datum fall in the extent?
    var diff_from_bottom = datum - scheme_domain_extent[0];
    var diff_pct = diff_from_bottom / (scheme_domain_extent[1] - scheme_domain_extent[0]);

    var pct_in_range = (scheme_range_extent[1] - scheme_range_extent[0]) * diff_pct;
    return scheme_range_extent[0] + pct_in_range;
  }

  return this;
}