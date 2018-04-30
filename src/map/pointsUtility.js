import polylabel from "../../lib/polylabel";

// Determines the coordinates of text or points, depending on if the layer is polygons or points.
export default function pointsUtility(swiftmap, d){
	// In geometries of type MultiPolygon,
	// get the polylabel that is closest to centroid.
	var closest;

	if (d.geometry.type == "MultiPolygon"){	
		var min = Infinity,
        c = swiftmap.path.centroid(d);

		for (var i = 0, l = d.geometry.coordinates.length; i < l; i++){

			var p = swiftmap.meta.projection.function(polylabel(d.geometry.coordinates[i], .01)),
					dist = Math.sqrt(Math.pow(p[0] - c[0], 2) + Math.pow(p[1] - c[1], 2));

			if (Number.isFinite(dist) && dist < min){
				min = dist;
				closest = p;
			}
		}
	}

	// TODO: Find a good labeling algorithm.
  return d.properties.swiftmap.layer == "polygons" ?
	  d.geometry.type === "MultiPolygon" ? closest || swiftmap.path.centroid(d) :
	  swiftmap.meta.projection.function(polylabel(d.geometry.coordinates, .01)) :
	  swiftmap.meta.projection.function(d.geometry.coordinates);
}