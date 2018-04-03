// modules
import * as d3_selection from "d3-selection";

// utility functions
import keepNumber from "./utils/keepNumber";

// resizes the map
export default function resize() {
  // size attributes
  this.width = this.wrapper == "body" ? window.innerWidth :
    +keepNumber(d3_selection.select(this.wrapper).style("width"));
  this.height = this.wrapper == "body" ? window.innerHeight :
    +keepNumber(d3_selection.select(this.wrapper).style("height"));
  this.svg.attr("width", this.width).attr("height", this.height);
  
  this.fitSize();

  this.svg.selectAll("path").attr("d", this.path);
  var projection = this.projection;
  this.svg.selectAll("text").attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; });
         
  return this;
}