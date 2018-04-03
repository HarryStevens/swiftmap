// modules
import * as d3_geo from "d3-geo";
import * as d3_selection from "d3-selection";

// src
import centerZoom from "./centerZoom";
import draw from "./draw";
import drawBoundary from "./drawBoundary";
import drawSubUnits from "./drawSubUnits";
import resize from "./resize";

// utility functions
import keepNumber from "./utils/keepNumber";

// Initializes a swiftmap
export default function init(options){
  // errors
  if (!options) throw new Error("You must specify options.");
  if (!options.data) throw new Error ("Your options must contain data.");

  // defaults
  if (!options.wrapper) options.wrapper = "body";

  // option attributes
  this.data = options.data;
  this.wrapper = options.wrapper;
  
  // projection
  this.projection = d3_geo.geoMercator();

  // size
  this.width = this.wrapper == "body" ? window.innerWidth :
    +keepNumber(d3_selection.select(this.wrapper).style("width"));
  this.height = this.wrapper == "body" ? window.innerHeight :
    +keepNumber(d3_selection.select(this.wrapper).style("height"));

   // derived attributes
   this.path = d3_geo.geoPath().projection(this.projection);
   this.svg = d3_selection.select(this.wrapper).append("svg").attr("width", this.width).attr("height", this.height);

  // functions
  this.centerZoom = centerZoom;
  this.draw = draw;
  this.drawBoundary = drawBoundary;
  this.drawSubUnits = drawSubUnits;
  this.resize = resize;

  return this;
}