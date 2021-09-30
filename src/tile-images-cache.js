class TileImagesCache {
  constructor(limit) {
    this.limit = limit;
    this._items = [];
  }

  /**
   * @param {TileImage} tileImage 
   */
  add(tileImage) {
    // no need to destroy, as we're just moving the item to the end of arr
    this.removeByKey(tileImage.key);
    this._items.push(tileImage);

    if (this._items.length > this.limit) {

      // Destroy the first image that has no parent and isn't from low-res layer
      const indexToRemove = this._items.findIndex(item => !item.hasParent && !item.isLowRes);
      if (indexToRemove !== -1) {
        let removedItem = this._items.splice(indexToRemove, 1)[0];
        removedItem.destroy();
      }
    }
  }

  /**
   * Removes an image from cache, does not destroy() it, just removes.
   * 
   * @param {String} key 
   */
  removeByKey(key) {
    const indexToRemove = this._items.findIndex(item => item.key === key);
    if (indexToRemove !== -1) {
      this._items.splice(indexToRemove, 1);
    }
  }

  getByKey(key) {
    return this._items.find(tileImage => tileImage.key === key);
  }

  destroy() {
    this._items = null;
  }
}

export default TileImagesCache;
