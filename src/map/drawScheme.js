// modules
import feature from "../../lib/swiftmap-topojson-bundler/feature";
import limits from "../../lib/swiftmap-chroma-bundler/limits";

// utility functions
import extent from "../utils/extent";
import keepNumber from "../utils/keepNumber";

export default function drawScheme(scheme, duration){

	if (scheme.constructor.name == "SchemeCategorical" || scheme.constructor.name == "SchemeSequential"){
		fill(scheme, duration, this);
	} 

	else if (scheme.constructor.name == "SchemeBubble") {
		drawBubbles(scheme, duration, this);
	}

	else {
		console.error("You must pass a valid scheme to map.drawScheme().");
		return;
	}

	function drawBubbles(scheme, duration, swiftmap) {
	  // check for geospatial data
	  if (swiftmap.meta.geo.length == 0) {
	    console.error("You must pass TopoJSON data through swiftmap.geometry() before you can draw bubbles.");
	    return;
	  }

	  // set this to true for resizing operations
	  swiftmap.meta.bubbles = true;
	  
	  // store some data in variables
	  var data_object = swiftmap.meta.geo.objects[Object.keys(swiftmap.meta.geo.objects)[0]];
	  var path = swiftmap.path;

	  swiftmap.bubbles = swiftmap.svg.selectAll(".bubble")
	      .data(feature(swiftmap.meta.geo, data_object).features, function(d){ return d.properties.key; });

	  swiftmap.bubbles.transition().duration(duration)
	      .attr("cx", function(d){ return path.centroid(d)[0]; })
	      .attr("cy", function(d){ return path.centroid(d)[1]; })

	  if (!scheme.skipRadius){
	    swiftmap.bubbles.transition().duration(duration)
	        .attr("r", radius);
	  }

	  swiftmap.bubbles.enter().append("circle")
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

	  return swiftmap;

	}

	function fill(scheme, duration, swiftmap){

	  // errors
	  if (!scheme){
	    console.error("You have not provided a color scheme to map.fill(), so your subunits will not be filled");
	    return;
	  }
	  if (swiftmap.meta.geo.length == 0){
	    console.error("Your map does not have any geospatial data associated with it. Before calling map.fill(), you must first add geospatial data with map.geometry()."); 
	    return;
	  }
	  if (scheme.meta.tab.length == 0){
	    console.error("Your scheme does not have any tabular data associated with it. Before calling map.fill(), you must first add data with scheme.data()."); 
	    return;
	  }
	  if (!swiftmap.subunits) {
	    console.error("Your map does not have subunits to fill. Before calling map.fill(), you must first call either map.drawSubunits() or map.draw().");
	    return;
	  }
	  
	  // put data in variables outside of the scope of the subunits fill
	  var tab = scheme.meta.tab,
	    geo = swiftmap.meta.geo;

	  // calculate the numerical buckets
	  var buckets = limits(tab.map(scheme.meta.values), scheme.meta.mode, scheme.meta.colors.length);
	  
	  // set the duration
	  if (!duration) duration = 0;
	  if (typeof duration !== "number" || duration < 0) {
	    console.warn("You must specify the duration as a positive number. The duration will be set to 0.");
	    duration = 0;
	  }

	  swiftmap.subunits.transition().duration(duration).style("fill", fillSubunits);

	  function fillSubunits(d){

	    // get the match and calculate the value
	    var match = tab
	      .filter(function(row){
	        return row.key == d.properties.key;
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