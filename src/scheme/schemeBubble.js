// scheme functions
import data from "./data";
import radiusRange from "./radiusRange";
import radiusValues from "./radiusValues";

export default function schemeBubble(){
  
  function SchemeBubble(){
    // data store
    this.meta = {
      radiusRange: [2, 20],
      tab: [],
      radiusValues: function(d){ return d; }
    }

    // functions
    this.data = data;
    this.radiusRange = radiusRange;
    this.radiusValues = radiusValues;
  }
  
  return new SchemeBubble;
}