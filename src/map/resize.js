import feature from "../../lib/topojson/feature";
import * as d3 from "../../lib/d3";
import keepNumber from "../utils/keepNumber";
import redraw from "./redraw";

// Resizes all map layers according to the dimensions of the parent.
export default function resize() {
  // Set the dimensions.
  this.width = this.parent == "body" ? window.innerWidth :
    +keepNumber(d3.select(this.parent).style("width"));
  this.height = this.parent == "body" ? window.innerHeight :
    +keepNumber(d3.select(this.parent).style("height"));
  this.svg.attr("width", this.width).attr("height", this.height);
  
  // Find the most recently fitted layer.
  var layer;
  for (var l in this.layers) {
    var l0 = this.layers[l];
    if (l0.fit) layer = l0;
  }
  if (layer) this.meta.projection.function.fitSize([this.width, this.height], feature(layer.data, layer.object));
  
  // Redraw everything.
  redraw(this);

  return this;
}