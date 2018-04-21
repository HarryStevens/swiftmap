// modules
import feature from "../../lib/swiftmap-topojson-bundler/feature";
import limits from "../../lib/swiftmap-chroma-bundler/limits";
import * as d3 from "../../lib/swiftmap-d3-bundler";

// utility functions
import extent from "../utils/extent";
import keepNumber from "../utils/keepNumber";

export default function drawScheme(scheme, duration, layer){

	// calculate the layer that needs to be drawn
  if (layer && typeof layer !== "string") {
    console.warn("You must specify the layer to fit as a string. Layer will default to " + this.meta.last_layer);
    layer = this.meta.last_layer;
  }
  
  var fit_layer = layer || this.meta.last_layer;

	if (scheme.constructor.name == "SchemeCategorical" || scheme.constructor.name == "SchemeSequential"){
		return fill(scheme, duration, this);
	} 

	else if (scheme.constructor.name == "SchemeBubble") {
		return drawBubbles(scheme, duration, this);
	}

	else {
		console.error("You must pass a valid scheme to map.drawScheme().");
		return;
	}


	function drawBubbles(scheme, duration, swiftmap) {
	  // check for geospatial data
	  if (Object.keys(swiftmap.layers).length === 0) {
	    console.error("You must pass TopoJSON data through swiftmap.polygons() before you can draw the map.")
	    return;
	  }

	  // set this to true for resizing operations
	  swiftmap.meta.bubbles = true;
	  
	  // store some data in variables
	  var curr_layer = swiftmap.layers[fit_layer];
	  var path = swiftmap.path;

	  swiftmap.layers[fit_layer].bubbles = swiftmap.svg.selectAll(".bubble")
	      .data(feature(curr_layer.data, curr_layer.object).features, function(d){ return d.properties.swiftmap.key; });

	  swiftmap.layers[fit_layer].bubbles.transition().duration(duration)
	      .attr("cx", function(d){ return path.centroid(d)[0]; })
	      .attr("cy", function(d){ return path.centroid(d)[1]; })

	  if (!scheme.skipRadius){
	    swiftmap.layers[fit_layer].bubbles.transition().duration(duration)
	        .attr("r", radius);
	  }

	  swiftmap.layers[fit_layer].bubbles.enter().append("circle")
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
	        return row.key == d.properties.swiftmap.key;
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

	  return swiftmap;

	}

	function fill(scheme, duration, swiftmap){

	  // check for a scheme
	  if (!scheme){
	    console.error("You have not provided a color scheme to map.drawScheme(), so your subunits will not be filled.");
	    return;
	  }
	  // check for geospatial data
	  if (Object.keys(swiftmap.layers).length === 0) {
	    console.error("You must pass TopoJSON data through swiftmap.polygons() before you can draw the map.")
	    return;
	  }
	  // check for tabular data
	  if (scheme.meta.tab.length == 0){
	    console.error("Your scheme does not have any tabular data associated with it. Before calling map.drawScheme(), you must first add data with scheme.data()."); 
	    return;
	  }
	  // check for subunits
	  if (!swiftmap.layers[fit_layer].subunits) {
	    console.error("Your map does not have subunits to fill. Before calling map.drawScheme(), you must first call either map.drawSubunits() or map.draw().");
	    return;
	  }
	  
	  // put data in variables outside of the scope of the subunits fill
	  var tab = scheme.meta.tab;

	  // calculate the numerical buckets
	  var buckets = limits(tab.map(scheme.meta.values), scheme.meta.mode, scheme.meta.colors.length);
	  
	  // set the duration
	  if (!duration) duration = 0;
	  if (typeof duration !== "number" || duration < 0) {
	    console.warn("You must specify the duration as a positive number. The duration will be set to 0.");
	    duration = 0;
	  }

	 	// fill the subunits
	 	d3.selectAll(".subunit.subunit-" + fit_layer).transition().duration(duration).style("fill", fillSubunits);

	  function fillSubunits(d){

	    // get the match and calculate the value
	    var match = tab
	      .filter(function(row){
	        return row.key == d.properties.swiftmap.key;
	      })
	      .map(scheme.meta.values);

	    // don't color if there is no match
	    if (match.length == 0){
	      return;
	    }

	    // if the scheme is sequential
	    if (scheme.constructor.name == "SchemeSequential") {

	      // calculate the correct color
	      var color;
	      buckets.forEach(function(bucket, bucket_index){
	        if (match[0] >= bucket && match[0] <= buckets[bucket_index + 1]){
	          color = scheme.meta.colors[bucket_index];
	        }
	      });

	      return color;

	    }

	    // if the scheme is categorical
	    else if (scheme.constructor.name == "SchemeCategorical"){
	      
	      // calculate the correct color
	      var color;
	      Object.keys(scheme.meta.colors).forEach(function(bucket){
	        if (match[0] == bucket){
	          color = scheme.meta.colors[bucket];
	        }
	      });

	      return color || scheme.meta.colorOther;

	    }

	  }

	  return swiftmap;

	}

}