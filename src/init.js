// modules
import * as d3_geo from "d3-geo";
import * as d3_selection from "d3-selection";

// data functions
import dataGeo from "./dataGeo";

// utility functions
import keepNumber from "./utils/keepNumber";

// Initializes a swiftmap
export default function init(wrapper){
  // errors
  if (wrapper && typeof wrapper !== "string") throw TypeError("The argument passed to swiftmap.init() must be a string.");

  // wrapper
  this.wrapper = wrapper ? wrapper : "body";
  
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

  // data object
  this.data = {
    geo: [],
    tab: []
  };

  // keys object
  this.keys = {}

  // data functions
  this.dataGeo = dataGeo;

  return this;
}