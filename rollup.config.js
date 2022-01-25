import { terser } from "rollup-plugin-terser";

const banner = `/**
* PhotoSwipe Deep Zoom plugin
* v1.1.0
* by Dmytro Semenov
* https://github.com/dimsemenov/photoswipe-deep-zoom-plugin
*/`;

export default {
  input: "src/index.js",
  output: [
    { file: "dist/photoswipe-deep-zoom-plugin.esm.js", format: "esm", banner },
    { file: "dist/photoswipe-deep-zoom-plugin.esm.min.js", format: "esm", plugins: [ terser()], banner },
  ],
};
