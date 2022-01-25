import TilesManager from './manager.js';
import TiledLayer from './tiled-layer.js';

class Tiler {
  constructor(slide, options) {
    this.slide = slide;
    this.data = slide.data;
    this.pswp = slide.pswp;
    this.options = options;

    this.tileSize = this.data.tileSize || options.tileSize;
    this.tileType = this.data.tileType || this.options.tileType || 'deepzoom';
    this.overlap = this.data.tileOverlap || options.tileOverlap || 0;
    this.maxWidth = this.data.maxWidth;
    this.maxHeight = this.data.maxHeight;

    if (this.options.maxTilePixelRatio > 1 && window.devicePixelRatio > 1) {
      this.tilePixelRatio = Math.min(window.devicePixelRatio, this.options.maxTilePixelRatio);
    } else {
      this.tilePixelRatio = 1;
    }

    this.layers = [];

    this.manager = new TilesManager(this);

    this.blockLoading = false;

    this.activeLayer = undefined;
    this.prevActiveLayer = undefined;

    this._prevProps = {};

    if (this.tileType === 'deepzoom') {
      this.setupDeepzoomLayers();
    } else if (this.tileType === 'zoomify') {
      this.setupZoomifyLayers();
    }
    this.createLayers();
  }

  setupDeepzoomLayers() {
    this.minZoomLayer = 0;
    this.maxZoomLayer = Math.ceil( Math.log( Math.max( this.maxWidth, this.maxHeight ) ) / Math.log( 2 ) );
  }

  setupZoomifyLayers() {
    let imageWidth = this.maxWidth;
    let imageHeight = this.maxHeight;

    this._zoomifyLayers = [];
    this._addZoomifyLayer(imageWidth, imageHeight);

    this._totalZoomifyTilesCount = 0;
    while (imageWidth > this.tileSize || imageHeight > this.tileSize) {
      imageWidth = imageWidth / 2;
      imageHeight = imageHeight / 2;
      this._addZoomifyLayer(imageWidth, imageHeight);
    }
    this._zoomifyLayers.reverse();

    this.minZoomLayer = 0;
    this.maxZoomLayer = this._zoomifyLayers.length - 1;
  }

  createLayers() {
    let scale;
    let width;
    let height;

    for(let i = this.minZoomLayer; i <= this.maxZoomLayer; i++) {
      scale = 1 / Math.pow(2, this.maxZoomLayer - i);
      width = Math.ceil(this.maxWidth * scale);
      height = Math.ceil(this.maxHeight * scale);
      
      this.layers.push(new TiledLayer(
        this,
        i,
        scale,
        width,
        height,
        Math.ceil(width / this.getBaseTileWidth(i)),
        Math.ceil(height / this.getBaseTileWidth(i)),
      ));
    }
  }

  getBaseTileWidth(z) {
    return this.tileSize;
  }

  getBaseTileHeight(z) {
    return this.tileSize;
  }

  setSize(width, height, forceUpdate, forceDelay) {
    const { slide } = this;

    const scale = slide.currZoomLevel / (slide.currentResolution || slide.zoomLevels.initial);
    if (scale !== 1) {
      // slide is animating / or zoom gesture is performed
      return;
    }

    // Size of image after it's zoomed
    this.width = width;
    this.height = height;

    let sizeChanged;
    if (width !== this._prevProps.width || height !== this._prevProps.height) {
      sizeChanged = true;
    }

    let panChanged;
    if (slide.pan.x !== this._prevProps.x || slide.pan.y !== this._prevProps.y) {
      panChanged = true;
    }

    this._prevProps.width = width;
    this._prevProps.height = height;
    this._prevProps.x = slide.pan.x;
    this._prevProps.y = slide.pan.y;
    
    if (sizeChanged) {
      // Update right away if size is changed to sync with PhotoSwipe core
      this.updateSize();
      if (this._updateSizeRaf) {
        cancelAnimationFrame(this._updateSizeRaf);
        this._updateSizeRaf = undefined;
      }
      return;
    }

    if (this._updateSizeRaf) {
      // update size is already scheduled, just wait
      return;
    }

    this._updateSizeRaf = requestAnimationFrame(() => {
      this._updateSizeRaf = undefined;
      this.updateSize();
    });
  }

  /**
   * Hide the primary image if viewer is zoomed beyond its size.
   * 
   * @returns Boolean True if primary image is visible
   */
  updatePrimaryImageVisibility() {
    if (this.slide.primaryImageWidth
      && this.width) {

      // Do not show tiles if image is smaller than "fit" zoom level
      if (this.width <= Math.round(this.pswp.currSlide.zoomLevels.fit * this.maxWidth)) {
        return true;
      }

      if (this.slide.primaryImageWidth / this.tilePixelRatio >= this.width) {
        return true;
      }
    }

    return false;
  }

  updateSize() {
    const useLowResLayer = this.options.useLowResLayer;

    this.manager.resetTilesRelations();

    let lowResLayer;
    if (useLowResLayer) {
      lowResLayer = this.layers.find((layer) => {
        return layer.originalWidth >= this.tileSize || layer.originalHeight >= this.tileSize;
      });
    }

    const primaryImageVisible = this.updatePrimaryImageVisibility();
    
    if (primaryImageVisible) {
      this.manager.destroyUnusedTiles();
      return;
    }

    // this.slide.image.style.display = 'none';

    // Always display the most optimal layer
    let newActiveLayer = this.layers.find((layer) => {
      return (layer.originalWidth / this.tilePixelRatio) >= this.width;
    });

    if (!newActiveLayer) {
      newActiveLayer = this.layers[this.layers.length - 1];
    }

    this.activeLayer = newActiveLayer;

    this.layers.forEach((layer) => {
      layer.activate();
      if (layer === this.activeLayer) {
        layer.updateTilesVisibility();
      } else if (layer === lowResLayer) {
        layer.updateTilesVisibility(true);
      } else {
        layer.updateScale();
      }
    });

    // Destroy tiles even if loading is blocked,
    // as user can zoom in layer to ridiculous size
    this.manager.destroyUnusedTiles();

    if (!this.blockLoading) {
      this.manager.displayTiles();
    }
  }

  onTileDisplayed(tile) {
    this.setSize(this.width, this.height, false, true);
  }

  getLayer(z) {
    return this.layers.find((layer) => {
      return layer.z === z;
    });
  }

  getTileUrl(x, y, z) {
    if (this.options.getTileUrlFn) {
      return this.options.getTileUrlFn(this.data, x, y, z);
    }

    switch(this.tileType) {
      case 'deepzoom':
        return this.getDeepzoomTileUrl(x, y, z);
      case 'zoomify':
        return this.getZoomifyTileUrl(x, y, z);
      default:
        return false;
    }
  }

  getDeepzoomTileUrl(x, y, z) {
    return (this.data.tileUrl || this.options.tileUrl)
          .replace('{x}', x)
          .replace('{y}', y)
          .replace('{z}', z);
  }
  
  getZoomifyTileUrl(x, y, z) {
    // Zoomify generator keeps up to 256 images per folder
    // based on the Openseadragon implementation https://github.com/openseadragon/openseadragon
    
    // find the absolute tile number
    let tileNumber = 0;
    for (let i = 0; i < z; i++) {
      tileNumber += this._zoomifyLayers[i].xTilesCount * this._zoomifyLayers[i].yTilesCount;
    }
    tileNumber += this._zoomifyLayers[z].xTilesCount * y + x;

    return (this.data.tileUrl || this.options.tileUrl)
          .replace('{zoomify_group}', Math.floor(tileNumber / 256))
          .replace('{x}', x)
          .replace('{y}', y)
          .replace('{z}', z);
  }

  _addZoomifyLayer(layerWidth, layerHeight) {
    this._zoomifyLayers.push({
      xTilesCount: Math.ceil(layerWidth / this.tileSize),
      yTilesCount: Math.ceil(layerHeight / this.tileSize)
    });
  }

  destroy() {
    clearTimeout(this._setSizeTimeout);
    this._setSizeTimeout = undefined;

    this.layers.forEach((layer) => {
      layer.destroy();
    });

    this.manager.destroy();

    if (this._updateLayersRaf) {
      cancelAnimationFrame(this._updateLayersRaf);
    }
  }
}

export default Tiler;