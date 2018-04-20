import mode from "./mode";

// takes a topojson, and finds the first matching object that matches
// the type passed, which can be either "polygons" and "points"
export default function getTopoObjectOfType(json, type){

	var return_object;

	var objects = Object.keys(json.objects);

	// just return the first matching object
	for (var i = 0, l = objects.length; i < l; i++) {
		var obj = objects[i];
		var object = json.objects[obj];
		var most_frequent_type = mode(object.geometries.map(function(d){ return d.type; }));
		if (type == "polygons" && most_frequent_type.indexOf("Polygon") !== -1) {
			return_object = object;
			break;
		}

		else if (type == "points" && most_frequent_type == "Points") {
			return_object = object;
			break;
		}

	}
	
	return return_object;
}