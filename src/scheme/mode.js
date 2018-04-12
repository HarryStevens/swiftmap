export default function mode(breaktype){
  if (!breaktype) return this.meta.mode;

  var available_modes = ["e", "q", "l", "k"]

  if (typeof breaktype !== "string" || breaktype instanceof String) {
    console.warn("You must specify the scheme's mode as a string. The mode will default to 'e'.");
  } else if (available_modes.indexOf(breaktype) == -1) {
    console.warn("You must specify the scheme's mode as either 'e', 'q', 'l', or 'k'. The mode will default to 'e'.");
  } else {
    this.meta.mode = breaktype;
  }
  
  return this;
}