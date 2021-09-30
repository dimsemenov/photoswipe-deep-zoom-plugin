# PhotoSwipe Tiled Deep Zoom Plugin

A plugin that adds tile-based zoom support to PhotoSwipe. Supports Deepzoom and Zoomify tile formats. 

Unlike conventional viewers such as [OpenLayers](https://openlayers.org/en/latest/examples/zoomify.html) or [OpenSeaDragon](https://openseadragon.github.io/), it displays tiles only when user zooms beyond the primary image size. If user does not zoom - PhotoSwipe operates as usual.

If you just want to display a single tiled image, consider using OpenLayers, OpenSeaDragon or Leaflet.


### Initialization

The plugin requires a single JS file `photoswipe-deep-zoom-plugin.esm.js`, grab it from the [dist/](directory), an example is there too.

```js
import PhotoSwipeLightbox from './lib/photoswipe/photoswipe-lightbox.esm.js';
import PhotoSwipeDeepZoom from './photoswipe-deep-zoom-plugin.esm.js';

const lightbox = new PhotoSwipeLightbox({
  gallery: '#gallery',
  child: '.pswp-gallery__item',
  pswpModule: 'lib/photoswipe/photoswipe.esm.js',

  // Recommended PhotoSwipe options for this plugin
  allowPanToNext: false, // prevent swiping to the next slide when image is zoomed
  allowMouseDrag: true, // display dragging cursor at max zoom level
  wheelToZoom: true, // enable wheel-based zoom
  preloader: false, // disable default loading indicator
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


### Build

```
npm run build
```
