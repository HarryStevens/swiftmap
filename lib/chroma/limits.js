import analyze from "./analyze";

export default function limits(data, mode, num) {
  var aa, ab, ac, ad, ae, af, ag, ah, ai, aj, ak, al, am, assignments, best, centroids, cluster, clusterSizes, dist, i, j, kClusters, limits, max, max_log, min, min_log, mindist, n, nb_iters, newCentroids, o, p, pb, pr, ref, ref1, ref10, ref11, ref12, ref13, ref14, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, repeat, sum, tmpKMeansBreaks, v, value, values, w;
  if (mode == null) {
    mode = 'equal';
  }
  if (num == null) {
    num = 7;
  }
  if (Array.isArray(data)) {
    data = analyze(data);
  }
  min = data.min;
  max = data.max;
  sum = data.sum;
  values = data.values.sort(function(a, b) {
    return a - b;
  });
  if (num === 1) {
    return [min, max];
  }
  limits = [];
  if (mode.substr(0, 1) === 'c') {
    limits.push(min);
    limits.push(max);
  }
  if (mode.substr(0, 1) === 'e') {
    limits.push(min);
    for (i = o = 1, ref = num - 1; 1 <= ref ? o <= ref : o >= ref; i = 1 <= ref ? ++o : --o) {
      limits.push(min + (i / num) * (max - min));
    }
    limits.push(max);
  } else if (mode.substr(0, 1) === 'l') {
    if (min <= 0) {
      throw 'Logarithmic scales are only possible for values > 0';
    }
    min_log = Math.LOG10E * Math.log(min);
    max_log = Math.LOG10E * Math.log(max);
    limits.push(min);
    for (i = w = 1, ref1 = num - 1; 1 <= ref1 ? w <= ref1 : w >= ref1; i = 1 <= ref1 ? ++w : --w) {
      limits.push(Math.pow(10, min_log + (i / num) * (max_log - min_log)));
    }
    limits.push(max);
  } else if (mode.substr(0, 1) === 'q') {
    limits.push(min);
    for (i = aa = 1, ref2 = num - 1; 1 <= ref2 ? aa <= ref2 : aa >= ref2; i = 1 <= ref2 ? ++aa : --aa) {
      p = (values.length - 1) * i / num;
      pb = Math.floor(p);
      if (pb === p) {
        limits.push(values[pb]);
      } else {
        pr = p - pb;
        limits.push(values[pb] * (1 - pr) + values[pb + 1] * pr);
      }
    }
    limits.push(max);
  } else if (mode.substr(0, 1) === 'k') {

    /*
    implementation based on
    http://code.google.com/p/figue/source/browse/trunk/figue.js#336
    simplified for 1-d input values
     */
    n = values.length;
    assignments = new Array(n);
    clusterSizes = new Array(num);
    repeat = true;
    nb_iters = 0;
    centroids = null;
    centroids = [];
    centroids.push(min);
    for (i = ab = 1, ref3 = num - 1; 1 <= ref3 ? ab <= ref3 : ab >= ref3; i = 1 <= ref3 ? ++ab : --ab) {
      centroids.push(min + (i / num) * (max - min));
    }
    centroids.push(max);
    while (repeat) {
      for (j = ac = 0, ref4 = num - 1; 0 <= ref4 ? ac <= ref4 : ac >= ref4; j = 0 <= ref4 ? ++ac : --ac) {
        clusterSizes[j] = 0;
      }
      for (i = ad = 0, ref5 = n - 1; 0 <= ref5 ? ad <= ref5 : ad >= ref5; i = 0 <= ref5 ? ++ad : --ad) {
        value = values[i];
        mindist = Number.MAX_VALUE;
        for (j = ae = 0, ref6 = num - 1; 0 <= ref6 ? ae <= ref6 : ae >= ref6; j = 0 <= ref6 ? ++ae : --ae) {
          dist = Math.abs(centroids[j] - value);
          if (dist < mindist) {
            mindist = dist;
            best = j;
          }
        }
        clusterSizes[best]++;
        assignments[i] = best;
      }
      newCentroids = new Array(num);
      for (j = af = 0, ref7 = num - 1; 0 <= ref7 ? af <= ref7 : af >= ref7; j = 0 <= ref7 ? ++af : --af) {
        newCentroids[j] = null;
      }
      for (i = ag = 0, ref8 = n - 1; 0 <= ref8 ? ag <= ref8 : ag >= ref8; i = 0 <= ref8 ? ++ag : --ag) {
        cluster = assignments[i];
        if (newCentroids[cluster] === null) {
          newCentroids[cluster] = values[i];
        } else {
          newCentroids[cluster] += values[i];
        }
      }
      for (j = ah = 0, ref9 = num - 1; 0 <= ref9 ? ah <= ref9 : ah >= ref9; j = 0 <= ref9 ? ++ah : --ah) {
        newCentroids[j] *= 1 / clusterSizes[j];
      }
      repeat = false;
      for (j = ai = 0, ref10 = num - 1; 0 <= ref10 ? ai <= ref10 : ai >= ref10; j = 0 <= ref10 ? ++ai : --ai) {
        if (newCentroids[j] !== centroids[i]) {
          repeat = true;
          break;
        }
      }
      centroids = newCentroids;
      nb_iters++;
      if (nb_iters > 200) {
        repeat = false;
      }
    }
    kClusters = {};
    for (j = aj = 0, ref11 = num - 1; 0 <= ref11 ? aj <= ref11 : aj >= ref11; j = 0 <= ref11 ? ++aj : --aj) {
      kClusters[j] = [];
    }
    for (i = ak = 0, ref12 = n - 1; 0 <= ref12 ? ak <= ref12 : ak >= ref12; i = 0 <= ref12 ? ++ak : --ak) {
      cluster = assignments[i];
      kClusters[cluster].push(values[i]);
    }
    tmpKMeansBreaks = [];
    for (j = al = 0, ref13 = num - 1; 0 <= ref13 ? al <= ref13 : al >= ref13; j = 0 <= ref13 ? ++al : --al) {
      tmpKMeansBreaks.push(kClusters[j][0]);
      tmpKMeansBreaks.push(kClusters[j][kClusters[j].length - 1]);
    }
    tmpKMeansBreaks = tmpKMeansBreaks.sort(function(a, b) {
      return a - b;
    });
    limits.push(tmpKMeansBreaks[0]);
    for (i = am = 1, ref14 = tmpKMeansBreaks.length - 1; am <= ref14; i = am += 2) {
      v = tmpKMeansBreaks[i];
      if (!isNaN(v) && limits.indexOf(v) === -1) {
        limits.push(v);
      }
    }
  }
  return limits;
};