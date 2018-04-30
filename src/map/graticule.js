import * as d3 from "../../lib/d3";
import isArray from "../utils/isArray";

export default function graticule(step){
  this.svg.append("path")
    .datum(d3.geoGraticule().step(step && isArray(step) ? step : [10, 10]))
    .attr("class", "graticule")
    .attr("d", this.path)
    .style("fill", "none")
    .style("stroke", "#ccc");

 return this;
}