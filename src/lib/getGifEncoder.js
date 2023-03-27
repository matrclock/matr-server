import GIFEncoder from "gif-encoder-2";

export default function getGifEncoder() {
  return new GIFEncoder(64, 32, `octree`, true);
}
