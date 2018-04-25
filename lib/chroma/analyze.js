import limits from "./limits";

export default function analyze(data) {
  var len, o, r, val;
  r = {
    min: Number.MAX_VALUE,
    max: Number.MAX_VALUE * -1,
    sum: 0,
    values: [],
    count: 0
  };
  for (o = 0, len = data.length; o < len; o++) {
    val = data[o];
    if ((val != null) && !isNaN(val)) {
      r.values.push(val);
      r.sum += val;
      if (val < r.min) {
        r.min = val;
      }
      if (val > r.max) {
        r.max = val;
      }
      r.count += 1;
    }
  }
  r.domain = [r.min, r.max];
  r.limits = function(mode, num) {
    return limits(r, mode, num);
  };
  return r;
};