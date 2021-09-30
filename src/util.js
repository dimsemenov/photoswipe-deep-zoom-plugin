export function getTileKey(x, y, z) {
  return x + '_' + y + '_' + z;
}

export function slideIsTiled(slide) {
  if (slide.data.tileUrl) {
    return true;
  }
  return false;
}
