import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";

export default {
  input: "index.js",
  output: {
    file: "lib/swiftmap.js",
    format: "umd",
    name: "swiftmap",
    globals: {
    	"d3-array": "d3",
    	"d3-geo": "d3",
      "d3-selection": "d3",
      "topojson-client": "topojson"
    }
  },
  plugins: [
    resolve({
    	only: ["d3-array", "d3-geo", "d3-selection", "topojson-client"]
    }),
    commonjs({
    	include: "node_modules/**"
    })
  ]
};
