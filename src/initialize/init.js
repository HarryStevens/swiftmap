// modules
import * as d3 from "../../lib/swiftmap-d3-bundler";

// init functions
import data from "./data";
import geometry from "./geometry";

// draw functions
import draw from "../draw/draw";
import drawBoundary from "../draw/drawBoundary";
import drawSubunits from "../draw/drawSubunits";
import fill from "../draw/fill";
import fitSize from "../draw/fitSize";
import resize from "../draw/resize";

// utility functions
import keepNumber from "../utils/keepNumber";

// Initializes a swiftmap
export default function init(parent){

  // errors
  if (parent && typeof parent !== "string") throw TypeError("The argument passed to swiftmap.init() must be a string.");

  function Swiftmap(parent){
    // parent
    this.parent = parent ? parent : "body";
    
    // projection
    this.projection = d3.geoMercator();

    // size
    this.width = this.parent == "body" ? window.innerWidth :
      +keepNumber(d3.select(this.parent).style("width"));
    this.height = this.parent == "body" ? window.innerHeight :
      +keepNumber(d3.select(this.parent).style("height"));

    // derived attributes
    this.path = d3.geoPath().projection(this.projection);
    this.svg = d3.select(this.parent).append("svg").attr("width", this.width).attr("height", this.height);

    // meta object for storing data
    this.meta = {
      geo: [],
      tab: []
    };

    // init functions
    this.data = data;
    this.geometry = geometry;

    // draw functions
    this.draw = draw;
    this.drawBoundary = drawBoundary;
    this.drawSubunits = drawSubunits;
    this.fill = fill;
    this.fitSize = fitSize;
    this.resize = resize;

  }

  return (new Swiftmap(parent));

}