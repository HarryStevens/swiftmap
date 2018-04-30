import drawTiles from "./drawTiles";

// Redraws all map layers.
export default function redraw(swiftmap){
	// Redraw the path.
  swiftmap.svg.selectAll("path").attr("d", swiftmap.path);

  // Redraw the text and points.
  swiftmap.svg.selectAll("text").attr("transform", function(d) { return "translate(" + getPoints(d) + ")"; });
  swiftmap.svg.selectAll("circle.point")
      .attr("cx", function(d) { return getPoints(d)[0]; })
      .attr("cy", function(d) { return getPoints(d)[1]; });
  
  // Determines the coordinates of text or points, depending on if the layer is polygons or points.
  function getPoints(d){
    return d.properties.swiftmap.layer == "polygons" ? swiftmap.path.centroid(d) : swiftmap.meta.projection.function(d.geometry.coordinates);
  }

  // Redraw the tiles, if any.
  if (swiftmap.meta.tiles) drawTiles(swiftmap);
}