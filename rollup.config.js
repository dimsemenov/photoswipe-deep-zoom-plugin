import { terser } from "rollup-plugin-terser";
 
export default {
  input: "src/index.js",
  output: [
    { file: "photoswipe-deep-zoom-plugin.esm.js", format: "esm" },
    { file: "photoswipe-deep-zoom-plugin.esm.min.js", format: "esm", plugins: [ terser()] },
  ],
};
