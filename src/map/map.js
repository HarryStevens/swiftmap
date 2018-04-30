import * as d3 from "../../lib/d3";

import layerPoints from "./layerPoints";
import layerPolygons from "./layerPolygons";
import projection from "./projection";
import tiles from "./tiles";

import draw from "./draw";
import drawBoundary from "./drawBoundary";
import drawLabels from "./drawLabels";
import drawPoints from "./drawPoints";
import drawPolygons from "./drawPolygons";
import fit from "./fit";
import resize from "./resize";

import keepNumber from "../utils/keepNumber";
import isStrig from "../utils/isString";

// Initializes a swiftmap
export default function map(parent){
  // Make sure the parent passed is a string.
  if (parent && !isString(parent)) {
    console.error("The argument passed to swiftmap.map() must be a string.");
    return;
  }

  function Swiftmap(parent){
    // Create a meta object for storing information about the map.
    this.meta = {
      layer_index: -1,
      last_layer: "",
      projection: {
        function: d3.geoMercator(),
        name: "mercator"
      },
      tiles: false
    };

    // A layers object to store the geospatial layers.
    this.layers = {};

    // Set the parent.
    this.parent = parent || "body";

    // Set the dimensions.
    this.width = this.parent == "body" ? window.innerWidth :
      +keepNumber(d3.select(this.parent).style("width"));
    this.height = this.parent == "body" ? window.innerHeight :
      +keepNumber(d3.select(this.parent).style("height"));

    // Set the path and append the SVG.
    this.path = d3.geoPath().projection(this.meta.projection.function);
    this.svg = d3.select(this.parent).append("svg").attr("width", this.width).attr("height", this.height);

    // Map functions.
    this.layerPoints = layerPoints;
    this.layerPolygons = layerPolygons;
    this.projection = projection;
    this.tiles = tiles;

    // Layer functions.
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