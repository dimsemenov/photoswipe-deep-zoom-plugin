import { LOAD_STATE } from './tile-image.js';

class Tile {
  constructor(x, y, z, tiler) {
    this.tiler = tiler;
    this.tiledLayer = tiler.getLayer(z);

    this.x = x;
    this.y = y;
    this.z = z;

    this.isPlaceholder = false;
    this.isInActiveLayer = false;
    this.isAttached = false;
    this.isDestroyed = false;
    this.isFullyDisplayed = false;
  }

  _initImage() {
    if (this.tileImage) {
      return;
    }

    const imageStyles = {
      position: 'absolute',
      left: 0,
      top: 0,
      width: 'auto',
      height: 'auto',
      pointerEvents: 'none',
      // This helps with scaling up images in safari
      imageRendering: '-webkit-optimize-contrast'
    };

    imageStyles.willChange = 'transform';

    // debug
    if (window.pswpDebug && window.pswpDebug.display_layer_borders) {
      let colors = ['red','blue','green','white','yellow','purple','black','orange','violet'];
      colors = colors.concat(colors).concat(colors).concat(colors).concat(colors);
      imageStyles.outline = 'solid 5px ' + colors[this.z];
      imageStyles.outlineOffset = '-5px';
    }

    // size
    const tileSize = this.tiler.getBaseTileWidth(this.z);
    const overlap = this.tiler.overlap;
    const xOffset = (this.x > 0 ? this.x * tileSize - overlap : 0);
    const yOffset = (this.y > 0 ? this.y * tileSize - overlap : 0);
    imageStyles.transform = 'translate(' + xOffset + 'px, ' + yOffset + 'px)';

    this.tileImage = this.tiler.manager.decodingQueue.getOrCreateImage(
      this.tiler.getTileUrl(this.x, this.y, this.z),
      this.x,
      this.y,
      this.z
    );
    if (this.isInActiveLayer && this.isPlaceholder) {
      this.tileImage.isLowRes = true;
    }
    this.tileImage.setStyles(imageStyles);
  }

  attach() {
    if (!this.isAttached) {
      this.isAttached = true;
      this.load();
    }
  }

  detach() {
    if (this.isAttached) {
      this.tileImage.tileDetached();
      if (this.tileImage.imageElement && this.tileImage.imageElement.parentNode) {
        this.tileImage.imageElement.remove();
      }

      this.isAttached = false;
      this.isFading = false;
      this.isFullyDisplayed = false;
    }

    if (this.fadeRaf) {
      cancelAnimationFrame(this.fadeRaf);
      this.fadeRaf = null;
    }

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  canBeDisplayed() {
    return this.tileImage && this.tileImage.loadState === LOAD_STATE.LOADED; /* && this.isFullyDisplayed */;
  }

  destroy() {
    this.detach();

    this.placeholderTile = null;

    this.isDestroyed = true;
  }

  load() {
    this._initImage();
    this.tileImage.tileAttached();
    this.tileImage.onDecoded = () => {
      this._onImageDecoded();
    };
    this.tileImage.onError = () => {
      this._onImageError();
    };
    this.tiler.manager.decodingQueue.loadImage(this.tileImage);
  }

  _onImageDecoded(e) {
    this._addToDOM();
  }

  _onImageError() {
    // remove tile image from cache
    this.tiler.manager.decodingQueue.cache.removeByKey(this.tileImage.key);
  }

  _addToDOM() {
    if (!this.isAttached) {
      // since decoding is async, it may happen after tile is detached
      return;
    }

    // todo
    const fadeInDuration = this.tiler.options.fadeInDuration;

    if (this.tileImage.imageElement.parentNode) {
      return;
    }

    if (!fadeInDuration 
        || this.tiledLayer.isLowRes 
        || this.isPlaceholder) {
      this.tileImage.imageElement.style.opacity = 1;
      this.tileImage.imageElement.style.transition = 'none';
      this.tiledLayer.addTileToDOMWithRaf(this, () => {
        this.isFullyDisplayed = true;
        this.triggerDisplayed();
      });
      return;
    }

    this.isFading = true;

    this.tileImage.imageElement.style.opacity = 0;
    this.tileImage.imageElement.style.transition = 'opacity ' + fadeInDuration + 'ms linear';
    this.tiledLayer.addTileToDOMWithRaf(this, () => {
      this.fadeRaf = requestAnimationFrame(() => {
        this.tileImage.imageElement.style.opacity = 1;
        this.timeout = setTimeout(() => {
          if (this.isAttached) {
            this.timeout = null;
            this.tileImage.imageElement.transition = 'none';
            this.isFading = false;
            this.isFullyDisplayed = true;
            this.triggerDisplayed();
          }
        }, fadeInDuration + 200);
        this.fadeRaf = null;
      });
    });
  }

  triggerDisplayed() {
    this.tiler.onTileDisplayed(this);
  }
}

export default Tile;
