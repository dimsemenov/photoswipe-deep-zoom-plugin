import { terser } from "rollup-plugin-terser";
 
export default {
  input: "src/index.js",
  output: [
    { file: "dist/photoswipe-deep-zoom-plugin.esm.js", format: "esm" },
    { file: "dist/photoswipe-deep-zoom-plugin.esm.min.js", format: "esm", plugins: [ terser()] },
  ],
};
