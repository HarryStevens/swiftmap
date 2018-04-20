// tests whether geospatial json is topojson
export default function isTopoJson(json){
	return json.type == "Topology" && !!json.arcs && !!json.transform && !!json.objects;
}