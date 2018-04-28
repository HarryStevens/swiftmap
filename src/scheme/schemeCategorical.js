import isArray from "../utils/isArray";
import isObject from "../utils/isObject";
import isFunction from "../utils/isFunction";
import isString from "../utils/isString";

export default function(){
  var data = [],
      to = null,
      toOther = null,
      from = null;

  function schemeCategorical(d, i, els){
    var output;

    // Use in maps.
    if (isObject(d)){
      var match = data
        .filter(function(row){ 
          return row.swiftmap.key == d.properties.swiftmap.key;
        })
        .map(from)[0] || undefined;

      output = toOther;
    
      Object.keys(to).forEach(function(key){
        if (match == key) output = to[key];
      });
    }

    // Use in legends.
    else {
      output = to[Object.keys(to).filter(function(f){ return f == d; })[0]] || toOther;
    }
    
    return output;
  }

  schemeCategorical.data = function(array, key){
    if (arguments.length){
      if (isArray(array)){
        array.forEach(function(d, i, data){
          d.swiftmap = {};
          d.swiftmap.key = isFunction(key) ? key(d, i, data) : i;
          return d;
        });
        data = array;
      }

      return (data, schemeCategorical);
    } 

    else {
      return data;
    }
  }

  schemeCategorical.from = function(mapper){
    return arguments.length ? (from = isFunction(mapper) ? mapper : from, schemeCategorical) : from;
  }

  schemeCategorical.to = function(obj){
    return arguments.length ? (to = isObject(obj) ? obj : to, schemeCategorical) : to;
  }

  schemeCategorical.toOther = function(string){
    return arguments.length ? (toOther = isString(string) ? string : toOther, schemeCategorical) : toOther;
  }

  return schemeCategorical;
}