import { terser } from "rollup-plugin-terser";
import { version } from "./package.json";

const banner = `/**
* PhotoSwipe Deep Zoom plugin
* v${version}
* by Dmytro Semenov
* https://github.com/dimsemenov/photoswipe-deep-zoom-plugin
*/`;

export default {
  input: "src/index.js",
  output: [
    { file: "./photoswipe-deep-zoom-plugin.esm.js", format: "esm", banner },
    { file: "./photoswipe-deep-zoom-plugin.esm.min.js", format: "esm", plugins: [ terser()], banner },
  ],
};
