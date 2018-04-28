import toSlugCase from "../utils/toSlugCase";
import isString from "../utils/isString";
import isFunction from "../utils/isFunction";
import getTopoObjectOfType from "../utils/getTopoObjectOfType";

export default function tiles(type){
  // Test if the type is a string
  if (type && !isString(type) && !isFunction(type)){
    console.warn("The type passed to map.layerTiles() must be specified as a string or a function. The type will default to 'openStreetMap'.");
    type = "openStreetMap";
  }

  // Update the type.
  this.meta.tiles = type || "openStreetMap";

  return this;
}