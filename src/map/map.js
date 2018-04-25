import * as d3 from "../../lib/d3";

import layerPoints from "./layerPoints";
import layerPolygons from "./layerPolygons";
import projection from "./projection";

import draw from "./draw";
import drawBoundary from "./drawBoundary";
import drawLabels from "./drawLabels";
import drawPoints from "./drawPoints";
import drawPolygons from "./drawPolygons";
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
    this.layerPoints = layerPoints;
    this.layerPolygons = layerPolygons;
    this.projection = projection;

    // draw functions
    this.draw = draw;
    this.drawBoundary = drawBoundary;
    this.drawLabels = drawLabels;
    this.drawPoints = drawPoints;
    this.drawPolygons = drawPolygons;
    this.fit = fit;
    this.resize = resize;

  }

  return (new Swiftmap(parent));

}