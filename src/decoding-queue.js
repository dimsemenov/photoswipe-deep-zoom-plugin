import TileImage, { LOAD_STATE, DECODING_STATE } from './tile-image.js';
import TileImagesCache from './tile-images-cache.js';
import { getTileKey } from './util.js';

class DecodingQueue {
  constructor(options) {
    this.images = [];
    this.maxDecodingCount = options.maxDecodingCount;
    this.minBatchRequestCount = options.minBatchRequestCount; 
    this.cacheLimit = options.cacheLimit;

    this._imagesDecodingCount = 0;
    this.cache = new TileImagesCache(this.cacheLimit);
  }

  /**
   * @param {TileImage} tileImage 
   */
  cacheImage(tileImage) {
    if (tileImage.loadState !== LOAD_STATE.ERROR) {
      this.cache.add(tileImage);
    }
  }

  hasLoadedImage(x, y, z) {
    let image = this.getImage(x, y, z);

    if (image && image.loadState === LOAD_STATE.LOADED) {
      return true;
    }

    return false;
  }

  getImage(x, y, z) {
    let image = this.cache.getByKey( getTileKey(x, y, z) );
    if (!image) {
      image = this.images.find((item) => {
        return item.x === x && item.y === y && item.z === z;
      });
    }
    return image;
  }

  getOrCreateImage(url, x, y, z) {
    let image = this.getImage(x, y, z);

    if (!image) {
      image = new TileImage(url, x, y, z);
    }

    return image;
  }

  /**
   * 
   * @param {TileImage} imag
   */
  loadImage(image) {
    // The queue already contains this image
    if (this.images.includes(image)) {
      return;
    }

    this.images.push(image);

    if (!this._rafLoop) {
      this.refresh();
    }
  }

  refresh() {
    this._imagesDecodingCount = 0;
    this._imagesLoadingCount = 0;

    this.images = this.images.filter((image) => {
      if (image.loadState === LOAD_STATE.ERROR) {
        // remove if loaded with an error
        return false;
      }
      
      if (image.loadState === LOAD_STATE.LOADED && image.decodingState === DECODING_STATE.DECODED) {
        // remove if image is fully loaded and decoded
        return false;
      }

      if (!image.hasParent && image.decodingState === DECODING_STATE.IDLE) {
        // image not started decoding yet, and has no parent Tile that is attached,
        // we can safely remove it from queue
        return false;
      }

      if (image.loadState === LOAD_STATE.LOADING) {
        this._imagesLoadingCount++;
      }

      if (image.decodingState === DECODING_STATE.DECODING) {
        this._imagesDecodingCount++;
        return true;
      } 

      return true;
    });

    // Decode images that were loaded before, 
    // but then were removed, and now are added back
    this.images.forEach((image) => {
      if (image.hasParent 
        && image.decodingState === DECODING_STATE.IDLE
        && image.loadState === LOAD_STATE.LOADED) {
        // Instantly decode low-res images ignoring max count
        if (this._imagesDecodingCount < this.maxDecodingCount 
            || image.isLowRes) {
          this._decodeImage(image);
        }
      }
    });

    // Make sure we run requests simultaneously
    if (this._imagesLoadingCount < this.minBatchRequestCount) {
      // This should send network requests to load images
      this.images.forEach((image) => {
        if (image.hasParent 
          && image.decodingState !== DECODING_STATE.DECODING
          && this._imagesDecodingCount < this.maxDecodingCount) {
          this._decodeImage(image);
        }
      });
    }
    

    if (this.images.length === 0) {
      this.stop();
    } else {
      this._loop();
    }
  }

  _decodeImage(image) {
    this._imagesDecodingCount++;
    image.decode();
    this.cacheImage(image);
  }

  _loop() {
    this._rafLoop = requestAnimationFrame(() => {
      this.refresh();
    });
  }

  stop() {
    if (this._rafLoop) {
      cancelAnimationFrame(this._rafLoop);
      this._rafLoop = null;
    }
  }
  

  /**
   * Add to queue
   * 
   * @param {Array} tiles 
   */
  add(tiles) {
    const tilesThatWereLoadedBefore = [];
    const activeLayerTiles = [];
    const otherTiles = [];

    // todo: make tiles load from center?

    tiles.forEach((tile) => {
      if (tile.imageLoaded || tile.imageLoading) {
        tilesThatWereLoadedBefore.push(tile);
      } else if(tile.isInActiveLayer) {
        activeLayerTiles.push(tile);
      } else {
        otherTiles.push(tile);
      }
    });

    tilesThatWereLoadedBefore.sort(function(tile1, tile2) {
      return tile1.z - tile2.z;
    });

    this.images = this.images
      .concat(tilesThatWereLoadedBefore)
      .concat(activeLayerTiles)
      .concat(otherTiles);
  }

  clear() {
    this.images = [];
    this.stop();
  }

  destroy() {
    this.clear();
    this.cache.destroy();
    this.cache = undefined;
    this.images = [];
  }
}

export default DecodingQueue;
