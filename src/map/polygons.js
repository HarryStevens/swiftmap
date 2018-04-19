import toSlugCase from "../utils/toSlugCase";

export default function polygons(data, key, cl){

  // update the layer index
  ++this.meta.layer_index;

  // if the class exists but is not a string, set it to null
  if (!cl){
    cl = null;
  } else if (cl && typeof cl !== "string"){
    console.warn("You must specify the polygon layer's name as a string. The layer name will default to the layer's index, which is currently " + this.meta.layer_index + ".")
    cl = null;
  } else if (toSlugCase(cl) !== cl){
    var slug = toSlugCase(cl);
    console.warn("The CSS class of the polygon layer's name will be slugified to '" + slug + "'.");
    cl = slug;
  }

  // if no data is passed, then this is a getter function
  if (!data) {
    return this.meta.polygons[this.meta.layer_index];
  }

  // if the key is not a function, set the key property of each datum matches its index
  if (key && typeof key !== "function") {
    console.warn("The key must be specified as a function. The key will default to (d, i) => i");
    key = function(d, i){ return i; }
  }

  // if data is passed, then this is a setter function

  // if a class has been passed (and not nullified),
  // then we remove the current index from the polygons
  // also, that's the property we pull from the polygons
  // otherwise, pull the index
  var prop;
  if (cl) {
    delete this.meta.polygons[this.meta.layer_index];
    prop = cl;
  } else {
    prop = this.meta.layer_index;
  }

  this.meta.last_layer = prop;
  if (!this.layers[prop]) this.layers[prop] = {name: prop, boundary: false, subunits: false, scheme: false, fit: false};
  this.meta.polygons[prop] = data;

  // if a key is passed, add the key to the data
  // otherwise, assign the index to the key property
  this.meta.polygons[prop].objects[Object.keys(this.meta.polygons[prop].objects)[0]].geometries.forEach(function(d, i, arr){
    d.properties.key = key ? key(d, i, arr) : i;
    return d;
  });

  return this;
}