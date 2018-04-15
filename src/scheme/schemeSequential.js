// scheme functions
import colors from "./colors";
import data from "./data";
import mode from "./mode";
import values from "./values";

export default function schemeSequential(){
  
  function SchemeSequential(){
    // data store
    this.meta = {
      tab: [],
      colors: ["#ffffcc", "#a1dab4", "#41b6c4", "#2c7fb8", "#253494"],
      mode: "q",
      values: function(d){ return d; }
    }

    // functions
    this.colors = colors;
    this.data = data;
    this.mode = mode;
    this.values = values;
  }
  
  return new SchemeSequential;
}