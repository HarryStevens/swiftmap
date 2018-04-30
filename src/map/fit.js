import feature from "../../lib/topojson/feature";
import isString from "../utils/isString";
import isNumber from "../utils/isNumber";
import redraw from "./redraw";

// Sets a projection so a layer's outer boundary fits the dimensions of the map's parent.
export default function fit(layer) {  
  // If a layer is passed, make sure it is a string or a number.
  var layer_name = layer && (isString(layer) || isNumber(layer)) ? layer : this.meta.last_layer;
      layer = this.layers[layer_name];

  // Update the fit property in the layer, setting the fit property in all other to false.
  for (var l in this.layers){
    this.layers[l].fit = l == layer_name;
  }
  
  // Set the fit.
  this.meta.projection.function.fitSize([this.width, this.height], feature(layer.data, layer.object));

  // Redraw it.
  redraw(this);

  return this;
}