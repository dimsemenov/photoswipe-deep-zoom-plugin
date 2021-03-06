# PhotoSwipe Tiled Deep Zoom Plugin

**[> Plugin demo <](https://dimsemenov.github.io/photoswipe-deep-zoom-plugin/)**

A plugin that adds tile-based zoom support to PhotoSwipe. Supports Deepzoom and Zoomify tile formats. 

Unlike conventional viewers such as [OpenLayers](https://openlayers.org/en/latest/examples/zoomify.html) or [OpenSeaDragon](https://openseadragon.github.io/), it displays tiles only when user zooms beyond the primary image size. If user does not zoom - PhotoSwipe operates as usual.

If you just want to display a single tiled image, consider using OpenLayers, OpenSeaDragon or Leaflet.

### Initialization

The plugin requires a single JS file [photoswipe-deep-zoom-plugin.esm.js](photoswipe-deep-zoom-plugin.esm.js). To view the source code visit [src/](src/).

Or install via NPM `npm install photoswipe-deep-zoom-plugin`.

```js
import PhotoSwipeLightbox from './lib/photoswipe/photoswipe-lightbox.esm.js';
import PhotoSwipe from './lib/photoswipe/photoswipe.esm.js';
import PhotoSwipeDeepZoom from './photoswipe-deep-zoom-plugin.esm.js';

const lightbox = new PhotoSwipeLightbox({
  gallery: '#gallery',
  children: '.pswp-gallery__item',
  pswpModule: PhotoSwipe,

  // Recommended PhotoSwipe options for this plugin
  allowPanToNext: false, // prevent swiping to the next slide when image is zoomed
  allowMouseDrag: true, // display dragging cursor at max zoom level
  wheelToZoom: true, // enable wheel-based zoom
  zoom: false // disable default zoom button
});

const deepZoomPlugin = new PhotoSwipeDeepZoom(lightbox, {
  // deep zoom plugin options, for example:
  tileSize: 256
});

lightbox.init();
```


HTML for a single slide:

```html
<div id="gallery" class="pswp-gallery">
  <a  
    class="pswp-gallery__item"
    href="primary-image.jpg"
    target="_blank"
    data-pswp-width="1600"
    data-pswp-height="1024"
    data-pswp-tile-type="deepzoom"
    data-pswp-tile-url="path/to/tiles/{z}/{x}_{y}.jpeg"
    data-pswp-max-width="5832"
    data-pswp-max-height="4409">
    <img src="thumbnail.jpg" alt="Image #1" />
  </a>
  <!-- more slides ... -->
</div>
```

Or as slide data:

```js
const slides = [
  {
    src: 'primary-image.jpg',
    w: 1600,
    h: 1024,
    msrc: 'thumbnail.jpg',
    tileType: 'deepzoom',
    tileUrl: 'path/to/tiles/{z}/{x}_{y}.jpeg',
    tileSize: 254,
    tileOverlap: 1,
    maxWidth: 5832,
    maxHeight: 4409
  },
  // more slides...
];

```

#### `data-pswp-tile-url`

Tile URL. Can be also defined as `tileUrl` property of the slide data. 

For example: `https://example.com/images/my-image/{z}/{x}_{y}.jpg`. `{z}`, `{x}` and `{y}` will be automaticlaly replaced with the corresponding tile coordinates.

If you're using Zoomify type, there in an additional template string `{zoomify_group}`. For example:

```
https://example.com/images/my-image/TileGroup{zoomify_group}/{z}-{x}-{y}.jpg"
```

#### `data-pswp-tile-type: 'deepzoom'`

`deepzoom` and `zoomify` tile types are supported for now. Can be also defined as `tileType` property of the slide data. 

#### `data-pswp-max-width` and `data-pswp-max-height`

Maximum size of the tiled image.

#### `data-pswp-max-zoom-width`

Optional. Controls how far the image can be zoomed, can be lower or higher than max-image-width.



### Tile sources

For now, the plugin only supports Zoomify and Deepzoom tiles. You may use [Vips](https://www.libvips.org/API/current/Making-image-pyramids.md.html) to generate them.


### Options

#### `fadeInDuration: 150`

Fade in animation duration for tiles when loaded, can be zero.

#### `cacheLimit: 200`

Number of tiles to keep cached.

#### `maxDecodingCount: 15`

Maximum decoding requests at a time.

#### `minBatchRequestCount: 6`

Batch requests together, so they aren't sent one at a time when `maxDecodingCount` is reached.

#### `tileSize: 256`

Default tile width. Individual slides can override it via `data-pswp-tile-size` attribute or `tileSize` property of the slide data.

#### `tileOverlap: 0`

Default tile overlap. Individual slides can override it via `data-pswp-tile-overlap` attribute or `tileOverlap` property of the slide data.


#### `incrementalZoomButtons: true`

Zoom in and zoom out buttons in the toolbar.

#### `useLowResLayer: false`

Will permanently display a low-resolution layer below the active one.

#### `forceWillChange: true`

Will apply `will-change:transform` to the placeholder and the primary PhotoSwipe image.

#### `getTileUrlFn`

A function that should return the individual tile URL. For example:

```
getTileUrlFn: (slideData, x, y, z) {
  return slideData.tileUrl
        .replace('{x}', x)
        .replace('{y}', y)
        .replace('{z}', z);
}
```

#### `maxTilePixelRatio: 1`

The viewer will load higher resolution tiles earlier on high DPI screens.

For example, if device pixel ratio is `2` (regular retina screen) and `maxTilePixelRatio: 2`, the viewer will render twice as many tiles.

If device pixel ratio is higher than `maxTilePixelRatio`, the viewer will render tiles according to the `maxTilePixelRatio` option. If it is lower - it'll render according to the device pixel ratio.



### Build

To build and minify JS in `dist/`:

```
npm run build
```

To update GitHub pages:

```
npm run publish:demo
```

### Changelog

#### v1.1

- High dpi screens support, added option `maxTilePixelRatio`.
- Added property `pswp-max-zoom-width` (`pswpMaxZoomWidth`) that allows increasing or reducing how far the slide can be zoomed.
- The plugin now adjusts behaviour of the loading indicator, it's displayed when tiles are loading.
- Added zoom keyboard shortcuts (`+` and `-`).
- Added reset zoom button, it's displayed when zoomed beyond x3 of the initial state.



