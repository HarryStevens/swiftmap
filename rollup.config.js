import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";

export default {
  input: "index.js",
  output: {
    file: "dist/swiftmap.js",
    format: "umd",
    name: "swiftmap",
    globals: {
      "d3-array": "d3",
      "d3-color": "d3",
      "d3-dispatch": "d3",
      "d3-ease": "d3",
      "d3-geo": "d3",
      "d3-interpolate": "d3",
      "d3-selection": "d3",
      "d3-timer": "d3",
      "d3-transition": "d3",
      "topojson-client": "topojson"
    }
  },
  plugins: [
    resolve({
    	only: ["d3-array", "d3-color", "d3-dispatch", "d3-ease", "d3-geo", "d3-interpolate", "d3-selection", "d3-timer", "d3-transition", "topojson-client"]
    }),
    commonjs({
    	include: "node_modules/**"
    })
  ]
};
