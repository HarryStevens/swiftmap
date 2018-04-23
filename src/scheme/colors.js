import calcBreakList from "./calcBreakList";

export default function colors(palette){
  if (!palette) return this.meta.colors;

  // type errors
  if (this.constructor.name == "SchemeSequential" && !Array.isArray(palette)) {
  	throw new TypeError("In schemeSequential.colors(palette), the palette must be specified as an array.");
  }
  if (this.constructor.name == "SchemeCategorical" && (typeof palette !== "object" || Array.isArray(palette))) {
  	throw new TypeError("In schemeCategorical.colors(palette), the palette must be specified as an object.");
  }

  this.meta.colors = palette;

  // calculate the breaklist
  this.meta.breaklist = calcBreakList(this);

  return this;
}