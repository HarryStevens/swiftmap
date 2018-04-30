import toSlugCase from "../utils/toSlugCase";
import isTopoJson from "../utils/isTopoJson";
import isString from "../utils/isString";
import isFunction from "../utils/isFunction";
import getTopoObjectOfType from "../utils/getTopoObjectOfType";

// Used to create both polygons and points layers.
export default function layerUtil(swiftmap, data, key, layer, type){
  // If no data is passed, then this is a getter function.
  if (!data) {
    return swiftmap.layers[swiftmap.meta.last_layer];
  } 

  // Otherwise, data was passed, so we add a layer.
  else {
    // Test if the data is TopoJSON. TODO: Support GeoJSON.
    if (!isTopoJson(data)){
      console.error("The geospatial data passed to map.layer" + type.charAt(0).toUpperCase() + type.substr(1) + "() must be formatted as TopoJSON.");
      return;
    }

    // Update the layer index.
    swiftmap.meta.layer_index = Object.keys(swiftmap.layers).length;

    // If the layer was not passed, set it to the layer index.
    if (!layer){
      layer = swiftmap.meta.layer_index;
    }

    // If the layer was passed but is not a string, set it to the layer index.
    // Also warn the user.
    else if (layer && !isString(layer)){
      console.warn("You must specify the polygon layer's name as a string. The layer name will default to the layer's index, which is currently " + swiftmap.meta.layer_index + ".")
      layer = swiftmap.meta.layer_index;
    }

    // If the layer is passed but is not a slug, slugify it.
    // Also warn the user.
    else if (toSlugCase(layer) !== layer){
      var slug = toSlugCase(layer);
      console.warn("The CSS class of the polygon layer's name will be slugified to '" + slug + "'.");
      layer = slug;
    }

    // Update the last layer tracker.
    swiftmap.meta.last_layer = layer;

    // Create the new layer.
    swiftmap.layers[layer] = {name: layer, type: type, data: data, fit: false};

    // Get the appropriate object from the TopoJSON.
    swiftmap.layers[layer].object = getTopoObjectOfType(data, type);

    // If the key was passed but is not a function,
    // set the key property of each datum to its index.
    if (key && !isFunction(key)) {
      console.warn("The key must be specified as a function. The key will default to (d, i) => i");
      key = function(d, i){ return i; }
    }

    // Assign the key and a layer property to a swiftmap object in each datum.
    swiftmap.layers[layer].object.geometries.forEach(function(d, i, arr){
      d.properties.swiftmap = d.properties.swiftmap || {};
      d.properties.swiftmap.key = key ? key(d, i, arr) : i;
      d.properties.swiftmap.layer = type;
      return d;
    });

    return swiftmap;
  }
}