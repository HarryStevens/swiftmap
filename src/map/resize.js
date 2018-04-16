// modules
import * as d3 from "../../lib/swiftmap-d3-bundler";

// utility functions
import keepNumber from "../utils/keepNumber";

// resizes the map
export default function resize() {
  // size attributes
  this.width = this.parent == "body" ? window.innerWidth :
    +keepNumber(d3.select(this.parent).style("width"));
  this.height = this.parent == "body" ? window.innerHeight :
    +keepNumber(d3.select(this.parent).style("height"));
  this.svg.attr("width", this.width).attr("height", this.height);
  
  if (this.meta.fit) this.fit();

  var projection = this.projection;
  var path = this.path;

  this.svg.selectAll("path").attr("d", path);
  this.svg.selectAll("text").attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; });

  // need to reposition bubbles
  if (this.meta.bubbles) this.drawBubbles();
         
  return this;
}