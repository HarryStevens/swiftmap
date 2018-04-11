// modules
import * as chroma from "chroma-js";

// utility functions
import keepNumber from "../utils/keepNumber";

export default function fill(scheme, duration){

  // errors
  if (this.meta.geo.length == 0){
    throw new Error("Your map does not have any geospatial data associated with it. Before calling fill() on your map, you must first add geospatial data with geometry()."); 
  }
  if (this.meta.tab.length == 0){
    throw new Error("Your map does not have any tabular data associated with it. Before calling fill() on your map, you must first add data with data()."); 
  }
  if (!this.subunits) {
    throw new Error("Your map does not have subunits to fill. Before calling fill() on your map, you must first call either drawSubunits() or draw().");
  }

  // warnings
  if (!scheme){
    console.warn("You have not provided a color scheme to fill(), so your subunits will not be filled");
    return;
  }
  
  // put data in variables outside of the scope of the subunits fill
  var tab = this.meta.tab,
    geo = this.meta.geo;

  // calculate the numerical buckets
  var buckets = chroma.default.limits(tab.map(scheme.meta.values), scheme.meta.mode, scheme.meta.colors.length);
  
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
      .map(function(row){
        return scheme.meta.values(row);
      });

    // don't color if there is no match
    if (match.length == 0){
      return;
    }

    // calculate the correct color
    var color;
    buckets.forEach(function(bucket, bucket_index){
      if (match[0] >= bucket && match[0] <= buckets[bucket_index + 1]) {
        color = scheme.meta.colors[bucket_index];
      }
    });

    return color;
  }

  return this;
}