// modules
import * as d3 from "../lib/swiftmap-d3-bundler";

// data functions
import geometry from "./geometry";
import data from "./data";

// color scheme functions
import colorScheme from "./colorScheme";

// draw functions
import draw from "./draw";
import drawBoundary from "./drawBoundary";
import drawSubunits from "./drawSubunits";
import fillSubunits from "./fillSubunits";
import fitSize from "./fitSize";
import resize from "./resize";

// utility functions
import keepNumber from "./utils/keepNumber";

// Initializes a swiftmap
export default function init(parent){

  console.log(d3);

  // errors
  if (parent && typeof parent !== "string") throw TypeError("The argument passed to swiftmap.init() must be a string.");

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

  // data object
  this.data = {
    geo: [],
    tab: [],
    colorScheme: {}
  };

  // keys object
  this.keys = {}

  // data functions
  this.geometry = geometry;
  this.data = data;

  // color scheme functions
  this.colorScheme = colorScheme;

  // draw functions
  this.draw = draw;
  this.drawBoundary = drawBoundary;
  this.drawSubunits = drawSubunits;
  this.fillSubunits = fillSubunits;
  this.fitSize = fitSize;
  this.resize = resize;

  return this;
}