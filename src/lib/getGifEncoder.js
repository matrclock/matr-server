import GIFEncoder from "gif-encoder-2";

export default function getGifEncoder() {
  const encoder = new GIFEncoder(64, 32, `neuquant`, true);
  encoder.setPaletteSize(1)
  return encoder
}
