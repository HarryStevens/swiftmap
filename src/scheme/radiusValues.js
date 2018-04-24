import calcBreakList from "./calcBreakList";

export default function radiusValues(mapper){
  // error
  if (!mapper) {
    console.warn("You must specify a mapper for bubble.radiusValues()");
  }

  // warning
  else if (typeof mapper !== "function") {
    console.warn("You must specify the bubble scheme's radius values as a mapping function. The mapping function will default to function(d){ return d; }.");
  }

  // set the values mapper
  else {
    this.meta.radiusValues = mapper;
  }
  
  return this;
}