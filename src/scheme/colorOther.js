export default function colorOther(color){
  if (!color) return this.meta.colorOther;

  this.meta.colorOther = color;

  return this;
}