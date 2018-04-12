// scheme functions
import colors from "./colors";
import colorOther from "./colorOther";
import values from "./values";

export default function schemeCategorical(){
  
  function SchemeCategorical(){
    // data store
    this.meta = {
      colors: {},
      values: function(d){ return d; },
      colorOther: "#ccc"
    }

    // functions
    this.colors = colors;
    this.colorOther = colorOther;
    this.values = values;
  }
  
  return new SchemeCategorical;
}