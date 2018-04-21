import toSlugCase from "../utils/toSlugCase";
import isTopoJson from "../utils/isTopoJson";
import getTopoObjectOfType from "../utils/getTopoObjectOfType";

export default function polygons(data, key, layer){

  // if no data is passed, then this is a getter function
  if (!data) {
    return this.layers[this.meta.last_layer];
  } 

  // otherwise, data was passed, so we add a layer
  else {

    // test if the data is even TopoJSON
    if (!isTopoJson(data)){
      console.error("The geospatial data passed to map.polygons() must be formatted as TopoJSON.");
      return;
    }

    // update the layer index
    this.meta.layer_index = Object.keys(this.layers).length;

    // if the layer was not passed, set it to the layer index
    if (!layer){
      layer = this.meta.layer_index;
    }

    // if the layer was passed but is not a string, set it to the layer index
    // but also warn the user
    else if (layer && typeof layer !== "string"){
      console.warn("You must specify the polygon layer's name as a string. The layer name will default to the layer's index, which is currently " + this.meta.layer_index + ".")
      layer = this.meta.layer_index;
    }

    // if the layer is passed but is not a slug, slugify it
    else if (toSlugCase(layer) !== layer){
      var slug = toSlugCase(layer);
      console.warn("The CSS class of the polygon layer's name will be slugified to '" + slug + "'.");
      layer = slug;
    }

    // update the last layer tracker
    this.meta.last_layer = layer;

    // create the new layer
    this.layers[layer] = {name: layer, type: "points", boundary: false, data: data, subunits: false, scheme: false, fit: false};

    // get the points object from the topojson
    this.layers[layer].object = getTopoObjectOfType(data, "points");

    // if the key was passed but is not a function,
    // set the key property of each datum to its index
    if (key && typeof key !== "function") {
      console.warn("The key must be specified as a function. The key will default to (d, i) => i");
      key = function(d, i){ return i; }
    }

    // assign the key
    this.layers[layer].object.geometries.forEach(function(d, i, arr){
      d.properties.swiftmap = d.properties.swiftmap || {};
      d.properties.swiftmap.key = key ? key(d, i, arr) : i;
      return d;
    });

    return this;
  }

  
}