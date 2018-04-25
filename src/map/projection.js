// modules
import * as d3 from "../../lib/d3";

export default function projection(projectionName){
  // if no data is passed, then this is a getter function
  if (!projectionName) {
    return this.meta.projection.function;
  }

  var available_projections = ["mercator", "albersUsa", "equirectangular"];

  // if the key is not a function, set the key property of each datum matches its index
  if (typeof projectionName !== "string") {
    console.warn("The projectionName must be specified as a string. The projectionName will default to 'mercator'.");
  }
  if (available_projections.indexOf(projectionName) == -1){
    console.warn("You must pass either 'mercator', 'albersUsa', or 'equirectangular' as the projectionName. The projectionName will default to 'mercator'.");
  }

  // if data is passed, then this is a setter function
  this.meta.projection.name = projectionName;
  this.meta.projection.function =
    projectionName == "mercator" ? d3.geoMercator() :
    projectionName == "albersUsa" ? d3.geoAlbersUsa() :
    d3.geoEquirectangular();
  this.path.projection(this.meta.projection.function);

  return this;
}