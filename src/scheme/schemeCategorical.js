// scheme functions
import colors from "./colors";
import colorOther from "./colorOther";
import values from "./values";

export default function schemeCategorical(){
  
  function SchemeCategorical(){
    // data store
    this.meta = {
      colors: {},
      colorOther: "#ccc",
      values: function(d){ return d; }
    }

    // functions
    this.colors = colors;
    this.colorOther = colorOther;
    this.values = values;
  }
  
  return new SchemeCategorical;
}