import Tile from './tile.js'; 
import DecodingQueue from './decoding-queue.js';
import { getTileKey } from './util.js';

class TilesManager {
  constructor(tiler) {
    this.tiler = tiler;
    this.tiles = {};
    this.decodingQueue = new DecodingQueue(tiler.options);
  }

  getOrCreateTile(x, y, z) {
    const key = getTileKey(x, y, z);
    let tile = this.getTileByKey(key);
    if (!tile) {
      tile = new Tile(x, y, z, this.tiler);
    }
    this.tiles[key] = tile;
    return tile;
  }

  getTileByKey(key) {
    return this.tiles[key];
  }

  getTile(x, y, z) {
    return this.getTileByKey( getTileKey(x, y, z) );
  }

  _detachTile(x, y, z) {
    const key = getTileKey(x, y, z);
    if (this.tiles[key]) {
      this.tiles[key].detach();
      delete this.tiles[key];
    }
  }

  /**
   * Show tile below the main one
   * (it's generally displayed until the main tile is loaded)
   * 
   * @param {Integer} x 
   * @param {Integer} y 
   * @param {Integer} z 
   * @returns Tile|false
   */
  showPlaceholderTileBelow(x, y, z) {
    x = Math.floor(x / 2);
    y = Math.floor(y / 2);
    z -= 1;

    if (z < 0) {
      return false;
    }

    const parentImage = this.decodingQueue.getImage(x, y, z);
    if (parentImage && parentImage.isLoaded()) {
      this.createPlaceholderTile(x, y, z);
      if (parentImage.isDecoded()) {
        return true;
      }
    }

    return this.showPlaceholderTileBelow(x, y, z);
  }

  createPlaceholderTile(x, y, z) {
    const tile = this.getOrCreateTile(x, y, z);
    tile.isPlaceholder = true;
  }


  showPlaceholderTilesAbove(x, y, z, maxZ) {
    z += 1;

    if (z > maxZ) {
      return false;
    }

    let visibleChildTilesCount = 0;
    for (let childX = x * 2; childX < (x * 2 + 2); childX++) {
			for (let childY = y * 2; childY < (y * 2 + 2); childY++) {
        let childImage = this.decodingQueue.getImage(childX, childY, z);
        if (childImage && childImage.isLoaded()) {
          this.createPlaceholderTile(childX, childY, z);
          if (childImage.isDecoded()) {
            visibleChildTilesCount++;
          }
        }
			}
		}

    // if all 4 tiles are visible - it means viewport is covered,
    // otherwise try to display a layer above:
    if (visibleChildTilesCount < 4) {
      for (let childX = x * 2; childX < (x * 2 + 2); childX++) {
        for (let childY = y * 2; childY < (y * 2 + 2); childY++) {
          this.showPlaceholderTilesAbove(childX, childY, z, maxZ);
        }
      }
    }
  }

  displayTiles() {
    let tilesToAttach = [];
    for(let key in this.tiles) {
      let tile = this.tiles[key];
      if (tile.isInActiveLayer || tile.isPlaceholder) {
        if (tile.isAttached) {
          // tile already attached, do nothing?
        } else {
          tilesToAttach.push(tile);
        }
      }
    }


    const tilesThatWereLoadedBefore = [];
    const activeLayerTiles = [];
    const otherTiles = [];

    tilesToAttach.forEach((tile) => {
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

    tilesToAttach = [];
    tilesToAttach = tilesToAttach
      .concat(tilesThatWereLoadedBefore)
      .concat(activeLayerTiles)
      .concat(otherTiles);

    tilesToAttach.forEach((tile) => {
      tile.attach();
      this.decodingQueue.cacheImage(tile.tileImage);
    });
  }

  destroyUnusedTiles() {
    for(let key in this.tiles) {
      let tile = this.tiles[key];
      if (!tile.isPlaceholder && !tile.isInActiveLayer) {
        this._detachTile(tile.x, tile.y, tile.z);
      }
    }
  }

  activeTilesLoaded() {
    for(let key in this.tiles) {
      let tile = this.tiles[key];
      if (tile.isInActiveLayer && !tile.isFullyDisplayed && !tile.isFading) {
        return false;
      }
    }
    return true;
  }

  resetTilesRelations() {
    for(let key in this.tiles) {
      let tile = this.tiles[key];
      tile.isPlaceholder = false;
      tile.isInActiveLayer = false;
    }
  }

  destroy() {
    for(let key in this.tiles) {
      let tile = this.tiles[key];
      tile.destroy();
    }
    this.decodingQueue.destroy();
    //this.queue.destroy();
    this.tiles = {};
  }
}

export default TilesManager;
