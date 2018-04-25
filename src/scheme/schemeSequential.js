import isArray from "../utils/isArray";
import isFunction from "../utils/isFunction";
import isString from "../utils/isString";
import limits from "../../lib/chroma/limits";

export default function(){
  var breaks = "e",
      data = [],
      to = null,
      toOther = null,
      from = null,
      all_limits = [];

  function calcLimits(){
    all_limits = isString(breaks) && data.length > 0 && to && from ? limits(data.map(from), breaks, to.length) : isArray(breaks) ? breaks : all_limits;
  }

  function schemeSequential(d, i, els){
    var match = data
      .filter(function(row){ 
        return row.swiftmap.key == d.properties.swiftmap.key;
      })
      .map(from)[0] || undefined;

    var output = toOther;
        
    all_limits.forEach(function(limit, limit_index){
      if (match >= limit && match <= all_limits[limit_index + 1]) output = to[limit_index];
    });

    return output;
  }

  schemeSequential.breaks = function(breaktype){
    if (arguments.length){
      breaks = isString(breaktype) || isArray(breaktype) ? breaktype : "e";
      calcLimits();
      return (breaks, schemeSequential);
    }

    else {
      return all_limits;
    }
  }

  schemeSequential.data = function(array, key){
    if (arguments.length){
      if (isArray(array)){
        array.forEach(function(d, i, data){
          d.swiftmap = {};
          d.swiftmap.key = isFunction(key) ? key(d, i, data) : i;
          return d;
        });
        data = array;
      }

      calcLimits();

      return (data, schemeSequential);
    } 

    else {
      return data;
    }
  }

  schemeSequential.from = function(mapper){
    if (arguments.length){
      from = isFunction(mapper) ? mapper : from;
      calcLimits();
      return (from, schemeSequential);
    }

    else {
      return from;
    }
  }

  schemeSequential.to = function(array){
    if (arguments.length){
      to = isArray(array) ? array : to;
      calcLimits();
      return (to, schemeSequential);
    }

    else {
      return to;
    }
  }

  schemeSequential.toOther = function(string){
    return arguments.length ? (toOther = isString(string) ? string : toOther, schemeSequential) : toOther;
  }

  return schemeSequential;
}