import layerUtility from "./layerUtility";

export default function layerPoints(data, key, layer){
  return layerUtility(this, data, key, layer, "points");
}