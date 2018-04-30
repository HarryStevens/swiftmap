import drawTiles from "./drawTiles";
import pointsUtility from "./pointsUtility"

// Redraws all map layers.
export default function redraw(swiftmap){
	// Redraw the path.
  swiftmap.svg.selectAll("path").attr("d", swiftmap.path);

  // Redraw the text and points.
  swiftmap.svg.selectAll("text").attr("transform", function(d) { return "translate(" + pointsUtility(swiftmap, d) + ")"; });
  swiftmap.svg.selectAll("circle.point")
      .attr("cx", function(d) { return pointsUtility(swiftmap, d)[0]; })
      .attr("cy", function(d) { return pointsUtility(swiftmap, d)[1]; });

  // Redraw the tiles, if any.
  if (swiftmap.meta.tiles) drawTiles(swiftmap);
}