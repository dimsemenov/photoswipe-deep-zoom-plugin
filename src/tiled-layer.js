import Tile from './tile.js';

function getTileCoordinateByPosition(pos, tileSize, maxTiles) {
  let tileCoordinate = Math.floor(pos / tileSize);
  tileCoordinate = Math.max(tileCoordinate, 0);
  tileCoordinate = Math.min(tileCoordinate, maxTiles - 1);
  return tileCoordinate;
}

class TiledLayer {
  /**
   * @param {Tiler}
   * @param {Integer} z             In dzi, each layer (z) item corresponds to folder
   * @param {Number} scale          Layer scale relative to the original (largest) size
   *                                (1 is original image)
   * @param {Number} originalWidth  Total width of the layer (if none tiles are scaled)
   * @param {Number} originalHeight Total height of the layer
   * @param {Integer} numXTiles     Number of horizontal tiles
   * @param {Integer} numYTiles     Number of vertical tiles
   */
  constructor(tiler, z, scale, originalWidth, originalHeight, numXTiles, numYTiles) {
    this.tiler = tiler;
    this.z = z;
    this.scale = scale;
    this.originalWidth = originalWidth;
    this.originalHeight = originalHeight;
    this.numXTiles = numXTiles;
    this.numYTiles = numYTiles;

    this.tileScale = 1;
    this.element = undefined;
    this.preventNewTiles = false;

    this.isActive = false;
  }

  activate() {
    if (!this.isActive) {
      this.isActive = true;

      if (!this.element) {
        this.element = document.createElement('div');
        this.element.className = 'pswp__deepzoom-tiles-container';
        this.element.style.position = 'absolute';
        this.element.style.left = 0;
        this.element.dataset.z = this.z;
        this.element.style.top = 0;

        this.element.style.zIndex = this.z * 10 + 10; // todo: configurable zindex
        this.tiler.slide.container.appendChild(this.element);
      }
    }
  }

  addTileToDOMWithRaf(tile, onAdded) {
    requestAnimationFrame(() => {
      if (tile.isAttached 
          && tile.tileImage.imageElement 
          && !tile.tileImage.imageElement.parentNode) {
        this.element.appendChild(tile.tileImage.imageElement);
        if (onAdded) {
          onAdded();
        }
      }
    });
  }

  updateScale() {
    this.tileScale = this.tiler.width / this.originalWidth;
    if (this.element) {
      this.element.style.transform = 'scale('+this.tileScale+')';
    }
  }

  updateTilesVisibility(isLowRes) {
    if (!this.isActive) {
      return [];
    }

    this.updateScale();
    
    let tileCoordinatesToAttach = this.getTileCoordinatesInViewport();
    
    // mark tiles to attach
    tileCoordinatesToAttach.forEach((coordinate) => {
      let tile = this.tiler.manager.getOrCreateTile(coordinate.x, coordinate.y, this.z);
      tile.isInActiveLayer = true;
      tile.isPlaceholder = isLowRes ? true : false;
      if (!isLowRes) {
        if (!tile.canBeDisplayed() || !tile.isFullyDisplayed) {
          this.tiler.manager.showPlaceholderTileBelow(tile.x, tile.y, tile.z);
          this.tiler.manager.showPlaceholderTilesAbove(tile.x, tile.y, tile.z, this.z + 1);
        }
      }
    });
  }

  getTileCoordinatesInViewport() {
    const { slide } = this.tiler;
    const scale = slide.currZoomLevel / (slide.currentResolution || slide.zoomLevels.initial);

    const tileWidth = this.tiler.getBaseTileHeight(this.z) * this.tileScale * scale;
    const tileHeight = tileWidth;

    const tileLeft = slide.pan.x;
    const tileTop = slide.pan.y;

    const viewportRight = this.tiler.pswp.viewportSize.x;
    const viewportBottom = this.tiler.pswp.viewportSize.y;

    const leftTileX = getTileCoordinateByPosition(-tileLeft, tileWidth, this.numXTiles);
    const rightTileX = getTileCoordinateByPosition(viewportRight - tileLeft, tileWidth, this.numXTiles);

    const topTileY = getTileCoordinateByPosition(-tileTop, tileHeight, this.numYTiles);
    const bottomTileY = getTileCoordinateByPosition(viewportBottom - tileTop, tileHeight, this.numYTiles);

    //const tilesToAttach = [];
    const tileCoordinates = [];
    for(let y = topTileY; y <= bottomTileY; y++) {
      for(let x = leftTileX; x <= rightTileX; x++) {
        tileCoordinates.push({x, y, z: this.z});
      }
    }

    return tileCoordinates;
  }
  

  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = undefined;
    }
  }
}

export default TiledLayer;
