import { getTileKey } from "./util.js";

export const LOAD_STATE = {
  IDLE: 'idle',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error',
};

export const DECODING_STATE = {
  IDLE: 'idle',
  DECODING: 'decoding',
  DECODED: 'decoded'
};

class TileImage {
  constructor(url, x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.key = getTileKey(x, y, z);

    this.url = url;
    this.hasParent = false; // the Image has an Tile that uses it
    this.loadState = LOAD_STATE.IDLE;
    this.decodingState = DECODING_STATE.IDLE;
    this.styles = undefined;
   
    this._createImage();
  }

  isLoaded() {
    return this.loadState === LOAD_STATE.LOADED;
  }

  isDecoded() {
    return this.decodingState === DECODING_STATE.DECODED;
  }

  setStyles(styles) {
    if (styles) {
      this.styles = styles;
      for(let name in this.styles) {
        this.imageElement.style[name] = this.styles[name];
      }
    }
  }

  tileDetached() {
    this.hasParent = false;
    if (this.decodingState !== DECODING_STATE.DECODING) {
      this.decodingState = DECODING_STATE.IDLE;
    }

  }

  tileAttached() {
    this.hasParent = true;
  }

  _createImage() {
    this.imageElement = new Image();
    this.imageElement.setAttribute('role', 'presentation');
    this.imageElement.setAttribute('alt', '');
    this.setStyles(this.styles);
  }

  decode() {
    if (this.loadState === LOAD_STATE.LOADED) {
      // if image is loaded and decoded, just exit
      if (this.decodingState === DECODING_STATE.DECODED) {
        this._onDecoded();
        return;
      }

      // if image is decoding, just wait for it
      if (this.decodingState === DECODING_STATE.DECODING) {
        return;
      }

      // start decoding
      if (this.decodingState === DECODING_STATE.IDLE) {
        this._startDecode();
      }
    } else if (this.loadState === LOAD_STATE.LOADING) {
      if (this.decodingState === DECODING_STATE.DECODING) {
        // if image is decoding, just wait for it
        return;
      }
    } else {
      // this.loadState === LOAD_STATE.IDLE || this.loadState === LOAD_STATE.ERROR
      
      // Image is not loaded yet, or needs a reload
      this._startDecode();
    }
  }

  _startDecode() {
    if (this.loadState === LOAD_STATE.ERROR) {
      this._createImage();
    }

    if (!this.imageElement.src) {
      this.imageElement.src = this.url;
    }

    this.decodingState = DECODING_STATE.DECODING;
    if (this.loadState !== LOAD_STATE.LOADED) {
      this.loadState = LOAD_STATE.LOADING;
    }
    if ('decode' in this.imageElement) {
      this.imageElement.decode().then(() => {
        this._onDecoded();
      }).catch((error) => {
        this._onDecodeError();
      });
    } else {
      if (this.loadState === LOAD_STATE.LOADED) {
        this._onDecoded();
      } else {
        this.imageElement.onload = () => {
          this._onDecoded();
        };
        this.imageElement.onerror = (e) => {
          this._onDecodeError();
        };
      }
    }
  }

  _onDecoded() {
    // If image has no parent, it won't be added to dom, 
    // thus it's not guaranteed that it's decoded
    this.decodingState = this.hasParent 
      ? DECODING_STATE.DECODED
      : DECODING_STATE.IDLE;
    
    this.loadState = LOAD_STATE.LOADED;

    if (this.onDecoded) {
      this.onDecoded(this);
    }
  }

  _onDecodeError() {
    this.decodingState = DECODING_STATE.IDLE;
    this.loadState = LOAD_STATE.ERROR;
    if (this.onError) {
      this.onError(this);
    }
  }

  destroy() {
    if (this.imageElement) {
      this.imageElement.onload = null;
      this.imageElement.onerror = null;
      this.imageElement = null;
    }
    this.onError = null;
    this.onDecoded = null;
  }

  
}

export default TileImage;
