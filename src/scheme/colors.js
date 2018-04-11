export default function colors(palette){
  if (!palette) return this.meta.colors;

  this.meta.colors = palette;

  return this;
}