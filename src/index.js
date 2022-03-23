import Tiler from './tiler.js';
import DeepZoomUI from './ui.js';
import { slideIsTiled } from './util.js';

const WHEEL_DEBOUNCE_DELAY = 85; // ms

const defaultOptions = {
  fadeInDuration: 150,
  tileWidth: 256,
  tileOverlap: 0,
  incrementalZoomButtons: true,

  maxTilePixelRatio: 2,

  forceWillChange: true,

  cacheLimit: 200,
  maxDecodingCount: 15,
  minBatchRequestCount: 6
};

class PhotoSwipeDeepZoom {
  constructor(lightbox, options) {
    lightbox.on('init', () => {
      this.handlePhotoSwipeOpen(lightbox.pswp, options);
    });
  }
  handlePhotoSwipeOpen(pswp, options) {
    this.pswp = pswp;
    this.options = {
      ...defaultOptions,
      ...options
    };

    this.ui = new DeepZoomUI(pswp, this.options);
    
    pswp.on('itemData', (e) => {
      this.parseItemData(e.itemData)
    });
    
    pswp.on('zoomLevelsUpdate', (e) => {
      if (e.slideData.tileUrl) {
        // Custom limit for the max zoom
        if (e.slideData.maxZoomWidth) {
          const maxWidth = e.slideData.maxZoomWidth;
          if (maxWidth) {
            const newMaxZoomLevel = maxWidth / e.zoomLevels.elementSize.x;
            e.zoomLevels.max = Math.max(
              e.zoomLevels.initial,
              newMaxZoomLevel
            );
          }
        }

        // For incremental zoom buttons
        e.zoomLevels.secondary = e.zoomLevels.max;
      }
    });

    pswp.on('slideInit', (e) => {
      if (slideIsTiled(e.slide)) {
        this._handleTiledSlideInit(e.slide);
      }
    });

    pswp.on('slideActivate', (e) => {
      if (slideIsTiled(e.slide)) {
        this.createTiler(e.slide);
      }
    });

    pswp.on('slideDeactivate', (e) => {
      if (slideIsTiled(e.slide)) {
        this.destroyTiler(e.slide);
      }
    });

    pswp.on('slideDestroy', (e) => {
      if (slideIsTiled(e.slide)) {
        this.destroyTiler(e.slide);
      }
    });

    pswp.on('appendHeavyContent', (e) => {
      if (slideIsTiled(e.slide)) {
        this._appendHeavyContent(e.slide);
      }
    });

    pswp.on('zoomPanUpdate', (e) => {
      if (slideIsTiled(e.slide)) {
        this._handleZoomPanChange(e.slide);
      }
    });

    pswp.on('imageSizeChange', (e) => {
      if (slideIsTiled(e.slide)) {
        this.updateTilerSize(e.slide);
      }
    });

    pswp.on('change', () => {
      if (slideIsTiled(pswp.currSlide)) {
        this.updateTilerSize(pswp.currSlide);
      }
    });

    pswp.on('loadComplete', (e) => {
      if (slideIsTiled(e.slide) && e.slide.tiler) {
        e.slide.tiler.updatePrimaryImageVisibility();
      }
    });

    // Block tile loading until wheel acion is finished
    // (to prevent unnessesary tile reuqests)
    this._wheelTimeout = undefined;
    pswp.on('wheel', (e) => {
      if (slideIsTiled(pswp.currSlide)) {
        if (pswp.currSlide.tiler) {
          pswp.currSlide.tiler.blockLoading = true;
        } 
        if (this._wheelTimeout) {
          clearTimeout(this._wheelTimeout);
        }
        this._wheelTimeout = setTimeout(() => {
          pswp.currSlide.tiler.blockLoading = false;
          pswp.currSlide.tiler.updateSize();
          this._wheelTimeout = undefined;
        }, WHEEL_DEBOUNCE_DELAY);
      }
    });
  }

  createTiler(slide) {
    if (!slide.tiler) {
      slide.tiler = new Tiler(slide, this.options);
    }
  }

  destroyTiler(slide) {
    if (slide.tiler) {
      slide.tiler.destroy();
      slide.tiler = undefined;
      if (slide.image) {
        slide.image.style.display = 'block';
      }
    }
  }

  _handleTiledSlideInit(slide) {
    if (!slide.primaryImageWidth) {
      slide.primaryImageWidth = slide.width;
      slide.primaryImageHeight = slide.height;
      slide.width = slide.data.maxWidth;
      slide.height = slide.data.maxHeight;
    }
  }

  _appendHeavyContent(slide) {
    this.createTiler(slide);
    this.updateTilerSize(slide);
  }

  _handleZoomPanChange(slide) {
    if (slide.isActive && slide.tiler) {
      this.updateTilerSize(slide);
    }
  }

  updateTilerSize(slide) {
    const scaleMultiplier = slide.currentResolution || slide.zoomLevels.initial;

    if (slide.tiler && slide.isActive) {
      const slideImage = slide.content.element;

      if (slide.placeholder) {
        this._setImgStyles(slide.placeholder.element, 5);
      }

      const width = Math.round(slide.width * scaleMultiplier);
      const height = Math.round(slide.height * scaleMultiplier);

      if (slideImage) {
        this._setImgStyles(slideImage, 7);
        if (width >= slide.primaryImageWidth) {
          if (slideImage.srcset) {
            // adjust sizes attribute so it's based on primary image size,
            // and not based on full (tiled) size
            const prevSizes = parseInt(slideImage.sizes, 10);
            if (prevSizes >= slide.primaryImageWidth) {
              slideImage.sizes = slide.primaryImageWidth + 'px';
              slideImage.dataset.largestUsedSize = width;
            }
          }

          // scale image instead of changing width/height
          slideImage.style.width = slide.primaryImageWidth + 'px';
          slideImage.style.height = slide.primaryImageHeight + 'px';
          const scale  = width / slide.primaryImageWidth;
          slideImage.style.transform = 'scale3d('+scale+','+scale+',1)';
          slideImage.style.transformOrigin = '0 0';
        } else {
          slideImage.style.transform = 'none';
        }
      }

      slide.tiler.setSize(width, height);
    } else {
      if (slide.image) {
        slide.image.style.transform = 'none';
      }
    }
  }
  
  parseItemData(itemData) {
    const element = itemData.element;
    if (!element) {
      return;
    }

    const linkEl = element.tagName === 'A' ? element : element.querySelector('a');
    if (!linkEl) {
      return;
    }

    if (linkEl.dataset.pswpTileUrl) {
      itemData.tileUrl = linkEl.dataset.pswpTileUrl;
    }

    if (linkEl.dataset.pswpTileType) {
      itemData.tileType = linkEl.dataset.pswpTileType;
    }

    if (linkEl.dataset.pswpTileSize) {
      itemData.tileSize = parseInt(linkEl.dataset.pswpTileSize, 10);
    }

    if (linkEl.dataset.pswpMaxWidth) {
      itemData.maxWidth = parseInt(linkEl.dataset.pswpMaxWidth, 10);
    }

    if (linkEl.dataset.pswpMaxZoomWidth) {
      itemData.maxZoomWidth = parseInt(linkEl.dataset.pswpMaxZoomWidth, 10);
    }

    if (linkEl.dataset.pswpMaxHeight) {
      itemData.maxHeight = parseInt(linkEl.dataset.pswpMaxHeight, 10);
    }

    itemData.tileOverlap = parseInt(linkEl.dataset.pswpTileOverlap, 10) || 0;
  }

  _setImgStyles(el, zIndex) {
    if (el && el.tagName === 'IMG') {
      el.style.zIndex = zIndex;
      if (this.options.forceWillChange) {
        el.style.willChange = 'transform';
      }
    }
  }
}

export default PhotoSwipeDeepZoom;
