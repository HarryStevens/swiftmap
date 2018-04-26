import * as d3 from "../../lib/d3";
import limits from "../../lib/chroma/limits";
import isArray from "../utils/isArray";
import isNumber from "../utils/isNumber";
import isFunction from "../utils/isFunction";
import isString from "../utils/isString";

export default function(){
  var data = [],
      from = null,
      to = [0, 1],
      toOther = null;
      
  function schemeContinuous(d, i, els){
    var match = data
      .filter(function(row){ 
        return row.swiftmap.key == d.properties.swiftmap.key;
      })
      .map(from)[0] || undefined;

    // A scale to calculate the appropriate output
    var scale = d3.scaleLinear()
      .domain(limits(data.map(from), "e", to.length - 1))
      .range(to);

    // Lab interpolation for colors.
    if (isString(to[0])) {
      scale.interpolate(d3.interpolateLab);
    }

    return match ? scale(match) : toOther;
    
  }


  schemeContinuous.data = function(array, key){
    if (arguments.length){
      if (isArray(array)){
        array.forEach(function(d, i, data){
          d.swiftmap = {};
          d.swiftmap.key = isFunction(key) ? key(d, i, data) : i;
          return d;
        });
        data = array;
      }

      return (data, schemeContinuous);
    } 

    else {
      return data;
    }
  }

  schemeContinuous.from = function(mapper){
    return arguments.length ? (from = isFunction(mapper) ? mapper : from, schemeContinuous) : from;
  }

  schemeContinuous.to = function(arr){
    return arguments.length ? (to = isArray(arr) ? arr : to, schemeContinuous) : to;
  }

  schemeContinuous.toOther = function(string){
    return arguments.length ? (toOther = isString(string) ? string : toOther, schemeContinuous) : toOther;
  }

  return schemeContinuous;
}