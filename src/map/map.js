// modules
import * as d3 from "../../lib/swiftmap-d3-bundler";

// init functions
import geometry from "./geometry";
import projection from "./projection";

// draw functions
import draw from "../map/draw";
import drawBoundary from "../map/drawBoundary";
import drawBubbles from "../map/drawBubbles";
import drawSubunits from "../map/drawSubunits";
import fill from "../map/fill";
import fit from "../map/fit";
import resize from "../map/resize";

// utility functions
import keepNumber from "../utils/keepNumber";

// Initializes a swiftmap
export default function map(parent){

  // errors
  if (parent && typeof parent !== "string") {
    throw TypeError("The argument passed to swiftmap.map() must be a string.");
  }

  function Swiftmap(parent){
    // meta object for storing data
    this.meta = {
      geo: [],
      fit: false,
      bubbles: false,
      projection: {
        function: d3.geoMercator(),
        name: "mercator"
      },
    };

    // parent
    this.parent = parent || "body";

    // size
    this.width = this.parent == "body" ? window.innerWidth :
      +keepNumber(d3.select(this.parent).style("width"));
    this.height = this.parent == "body" ? window.innerHeight :
      +keepNumber(d3.select(this.parent).style("height"));

    // derived attributes
    this.path = d3.geoPath().projection(this.meta.projection.function);
    this.svg = d3.select(this.parent).append("svg").attr("width", this.width).attr("height", this.height);

    // init functions
    this.geometry = geometry;
    this.projection = projection;

    // draw functions
    this.draw = draw;
    this.drawBoundary = drawBoundary;
    this.drawBubbles = drawBubbles;
    this.drawSubunits = drawSubunits;
    this.fill = fill;
    this.fit = fit;
    this.resize = resize;

  }

  return (new Swiftmap(parent));

}