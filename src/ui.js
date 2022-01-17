import { slideIsTiled } from "./util.js";

class DeepZoomUI {
  constructor(pswp, options) {
    this.pswp = pswp;
    this.options = options;
    
    pswp.on('uiRegister', () => {
      if (options.incrementalZoomButtons) {
        this.addButtons();
      }
    });

    pswp.on('imageClickAction', (e) => {
      if (slideIsTiled(pswp.currSlide)) {
        e.preventDefault();
        this.incrementalZoomIn(e.point);
      }
    });

    pswp.on('doubleTapAction', (e) => {
      if (slideIsTiled(pswp.currSlide)) {
        e.preventDefault();
        this.incrementalZoomIn(e.point);
      }
    });

    // Make sure that secondary zoom level is always at maximum
    pswp.on('zoomLevelsUpdate', (e) => {
      if (e.slideData.tileUrl) {
        e.zoomLevels.secondary = e.zoomLevels.max;
      }
    });
  }


  addButtons() {
    this.pswp.ui.registerElement({
      name: 'incrementalZoomIn',
      title: 'Zoom In',
      order: 10,
      isButton: true,
      html: {
        isCustomSVG: true,
        inner: '<path d="M17.426 19.926a6 6 0 1 1 1.5-1.5L23 22.5 21.5 24l-4.074-4.074z" id="pswp__icn-incremental-zoom-in"/>'
              + '<path fill="currentColor" d="M11 16v-2h6v2z"/>'
              + '<path fill="currentColor" d="M13 12h2v6h-2z"/>',
        outlineID: 'pswp__icn-incremental-zoom-in'
      },
      onClick: (e, zoomInBtnElement) => {
        this.incrementalZoomIn(false);
        this.updateZoomInButtonState(zoomInBtnElement);
      },
      onInit: (zoomInBtnElement) => {
        pswp.on('zoomPanUpdate', () => {
          this.updateZoomInButtonState(zoomInBtnElement);
        });
      }
    });

    this.pswp.ui.registerElement({
      name: 'incrementalZoomOut',
      title: 'Zoom Out',
      order: 9,
      isButton: true,
      html: {
        isCustomSVG: true,
        inner: '<path d="M17.426 19.926a6 6 0 1 1 1.5-1.5L23 22.5 21.5 24l-4.074-4.074z" id="pswp__icn-incremental-zoom-out"/>'
              + '<path fill="currentColor" d="M11 16v-2h6v2z"/>',
        outlineID: 'pswp__icn-incremental-zoom-out'
      },
      onClick: (e, zoomInBtnElement) => {
        this.incrementalZoomOut(false);
        this.updateZoomOutButtonState(zoomInBtnElement);
      },
      onInit: (zoomInBtnElement) => {
        pswp.on('zoomPanUpdate', () => {
          this.updateZoomOutButtonState(zoomInBtnElement);
        });
      }
    });

    this.pswp.ui.registerElement({
      name: 'zoomToStart',
      title: 'Zoom to start position',
      order: 8,
      isButton: true,
      html: {
        isCustomSVG: true,
        inner: '<path d="M16.02 8a7.4 7.4 0 00-5.3 2.12l-1.45-1.7L8 14.05l5.74-.36-1.4-1.66a5.4 5.4 0 11.13 8.04l-1.78 1.86A7.98 7.98 0 0024 16a8 8 0 00-7.97-8z" id="pswp__icn-zoom-to-start"/>',
        outlineID: 'pswp__icn-zoom-to-start'
      },
      onClick: (e, zoomToStartBtnElement) => {
        this.zoomToStart();
        this.updateZoomOutButtonState(zoomToStartBtnElement);
      },
      onInit: (zoomToStartBtnElement) => {
        pswp.on('zoomPanUpdate', () => {
          this.updateZoomOutButtonState(zoomToStartBtnElement);
        });
      }
    });
  }

  /**
   * Return the closest layer scale
   * 
   * @param {Number} scale 
   */
  getClosestLayerZoomLevel(scale) {
    const { tiler } = this.pswp.currSlide;
    if (!tiler) {
      return scale;
    }
    const layersScale = tiler.layers.map((layer) => layer.scale);
    const closestZoomLevel = layersScale.reduce((prev, curr) => {
      return (
        Math.abs(curr - scale) < Math.abs(prev - scale) 
        ? curr 
        : prev
      );
    });
    return closestZoomLevel;
  }

  incrementalZoomIn(point) {
    const { tiler } = this.pswp.currSlide;
    let destZoomLevel;

    if (tiler) {
      destZoomLevel = this.pswp.currSlide.currZoomLevel * 2;
      const closestZoomLevel = this.getClosestLayerZoomLevel(destZoomLevel);
      if (closestZoomLevel > this.pswp.currSlide.currZoomLevel) {
        destZoomLevel = closestZoomLevel;
      }
      destZoomLevel = Math.min(destZoomLevel, this.pswp.currSlide.zoomLevels.secondary);
    } else {
      destZoomLevel = this.pswp.currSlide.zoomLevels.secondary;
    }
    

    this.pswp.zoomTo(
      destZoomLevel, 
      point,
      this.pswp.options.zoomAnimationDuration
    );
  }

  zoomToStart() {
    this.pswp.zoomTo(
      this.pswp.currSlide.zoomLevels.fit, 
      false,
      this.pswp.options.zoomAnimationDuration
    );
  }

  incrementalZoomOut(point) {
    const { tiler } = this.pswp.currSlide;
    let destZoomLevel;

    if (tiler) {
      destZoomLevel = this.pswp.currSlide.currZoomLevel / 2;
      const closestZoomLevel = this.getClosestLayerZoomLevel(destZoomLevel);
      if (closestZoomLevel < this.pswp.currSlide.currZoomLevel) {
        destZoomLevel = closestZoomLevel;
      }
      destZoomLevel = Math.max(destZoomLevel, this.pswp.currSlide.zoomLevels.initial);
    } else {
      destZoomLevel = this.pswp.currSlide.zoomLevels.initial;
    }
    

    this.pswp.zoomTo(
      destZoomLevel, 
      point,
      this.pswp.options.zoomAnimationDuration
    );
  }

  updateZoomInButtonState(el) {
    if (!this.pswp.currSlide.currZoomLevel ||
      !this.pswp.currSlide.isZoomable() ||
      this.pswp.currSlide.currZoomLevel >= this.pswp.currSlide.zoomLevels.secondary) {
      el.setAttribute('disabled', 'disabled');
    } else {
      el.removeAttribute('disabled');
    }
  }

  updateZoomOutButtonState(el) {
    if (!this.pswp.currSlide.currZoomLevel ||
      !this.pswp.currSlide.isZoomable() ||
      this.pswp.currSlide.currZoomLevel <= this.pswp.currSlide.zoomLevels.fit) {
      el.setAttribute('disabled', 'disabled');
    } else {
      el.removeAttribute('disabled');
    }
  }
}

export default DeepZoomUI;
