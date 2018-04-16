export default function radiusRange(domain){
  if (!domain) return this.meta.radiusRange;

  // type errors
  if (!Array.isArray(domain)) {
    console.error("In schemeBubble.area(domain), the domain must be specified as an array.");
    return;
  }

  if (domain.length !== 2) {
    console.warn("In schemeBubble.area(domain), the domain array must have two items representing the minimum and maximum bubble areas, in pixels. The domain will be transformed to take the first and last values.");
    this.meta.radiusRange = [domain[0], domain[domain.length - 1]];
  } else {
    this.meta.radiusRange = domain;
  }

  return this;
}