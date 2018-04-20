import * as d3 from "../../lib/swiftmap-d3-bundler";

import polygons from "./polygons";
import projection from "./projection";

import draw from "./draw";
import drawBoundary from "./drawBoundary";
import drawSubunits from "./drawSubunits";
import drawScheme from "./drawScheme";
import fit from "./fit";
import resize from "./resize";

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
      layer_index: -1,
      last_layer: "",
      fit: false,
      bubbles: false,
      projection: {
        function: d3.geoMercator(),
        name: "mercator"
      },
    };

    // a layers object to store the geospatial layers
    this.layers = {};

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
    this.polygons = polygons;
    this.projection = projection;

    // draw functions
    this.draw = draw;
    this.drawBoundary = drawBoundary;
    this.drawSubunits = drawSubunits;
    this.drawScheme = drawScheme;
    this.fit = fit;
    this.resize = resize;

  }

  return (new Swiftmap(parent));

}