// scheme functions
import data from "./data";
import radiusRange from "./radiusRange";
import values from "./values";

export default function schemeBubble(){
  
  function SchemeBubble(){
    // data store
    this.meta = {
      radiusRange: [2, 20],
      tab: [],
      values: function(d){ return d; }
    }

    // functions
    this.data = data;
    this.radiusRange = radiusRange;
    this.values = values;
  }
  
  return new SchemeBubble;
}