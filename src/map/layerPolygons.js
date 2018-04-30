import layerUtility from "./layerUtility";

export default function layerPolygons(data, key, layer){
  return layerUtility(this, data, key, layer, "polygons"); 
}