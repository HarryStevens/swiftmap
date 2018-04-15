// modules
import limits from "../../lib/swiftmap-chroma-bundler/limits";

// utility functions
import keepNumber from "../utils/keepNumber";

export default function fill(scheme, duration){

  // errors
  if (!scheme){
    console.error("You have not provided a color scheme to map.fill(), so your subunits will not be filled");
    return;
  }
  if (this.meta.geo.length == 0){
    console.error("Your map does not have any geospatial data associated with it. Before calling map.fill(), you must first add geospatial data with map.geometry()."); 
    return;
  }
  if (scheme.meta.tab.length == 0){
    console.error("Your scheme does not have any tabular data associated with it. Before calling map.fill(), you must first add data with scheme.data()."); 
    return;
  }
  if (!this.subunits) {
    console.error("Your map does not have subunits to fill. Before calling map.fill(), you must first call either map.drawSubunits() or map.draw().");
    return;
  }
  
  // put data in variables outside of the scope of the subunits fill
  var tab = scheme.meta.tab,
    geo = this.meta.geo;

  // calculate the numerical buckets
  var buckets = limits(tab.map(scheme.meta.values), scheme.meta.mode, scheme.meta.colors.length);
  
  // set the duration
  if (!duration) duration = 0;
  if (typeof duration !== "number" || duration < 0) {
    console.warn("You must specify the duration as a positive number. The duration will be set to 0.");
    duration = 0;
  }

  this.subunits.transition().duration(duration).style("fill", fillSubunits);

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

  return this;
}