// a utility function for caclculating the breaklist of sequential schemes

import limits from "../../lib/swiftmap-chroma-bundler/limits";

export default function calcBreaklist(scheme){
  return scheme.meta.breaktype == "c" ?
    scheme.meta.breaklist :
    limits(scheme.meta.tab.map(scheme.meta.values), scheme.meta.breaktype, scheme.meta.colors.length);
}