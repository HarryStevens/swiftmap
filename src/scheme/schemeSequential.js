// scheme functions
import colors from "./colors";
import data from "./data";
import breaks from "./breaks";
import values from "./values";

export default function schemeSequential(){
  
  function SchemeSequential(){
    // data store
    this.meta = {
      tab: [],
      colors: ["#ffffcc", "#a1dab4", "#41b6c4", "#2c7fb8", "#253494"],
      breaktype: "q",
      breaklist: [],
      values: function(d){ return d; }
    }

    // functions
    this.colors = colors;
    this.data = data;
    this.breaks = breaks;
    this.values = values;
  }
  
  return new SchemeSequential;
}