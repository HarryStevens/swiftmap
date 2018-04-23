import calcBreaklist from "./calcBreaklist";

export default function breaks(breakargument){
  if (!breakargument) return this.meta.breaklist;

  // scope the scheme
  var scheme = this;

  // If the argument is not of a valid type, warn and default to quantile breaks
  if (typeof breakargument !== "string" && !Array.isArray(breakargument)) {
    console.warn("The argument passed to scheme.breaks() must be either a string or an array. The scheme will default to using quantile breaks.");
    his.meta.breaklist = calcBreaklist(this);
  }

  // If the argument is a string, compute the breaklist based on the breaktype
  else if (typeof breakargument === "string") {

    // If the breaktype passed does not match an available mode, set it to the default.
    if (["e", "q", "l", "k"].indexOf(breakargument) == -1) {
      console.warn("You must specify the scheme's breaktype as either 'e', 'q', 'l', or 'k'. The breaktype will default to 'q'.");
    }

    // Otherwise, update the breaktype
    else {
      this.meta.breaktype = breakargument;  
      this.meta.breaklist = calcBreaklist(this);
    }
  } 

  // If the argument is an array, we're using custom breaks, so just set the breaklist.
  else {
    this.meta.breaktype = "c";
    this.meta.breaklist = breakargument;
  }
  
  return this;
}