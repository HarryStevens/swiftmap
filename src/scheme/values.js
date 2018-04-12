export default function values(mapper){
  // error
  if (!mapper) {
    console.warn("You must specify a mapper for scheme.values()");
  }

  // warning
  else if (typeof mapper !== "function") {
    console.warn("You must specify the scheme's values as a mapping function. The mapping function will default to function(d){ return d; }.");
  }

  // set the values mapper
  else {
    this.meta.values = mapper;  
  }
  
  return this;
}