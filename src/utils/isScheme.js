import isFunction from "./isFunction";

export default function isScheme(scheme){
  return isFunction(scheme) && scheme.name == "schemeCategorical" || scheme.name == "schemeContinuous" || scheme.name == "schemeSequential";
}