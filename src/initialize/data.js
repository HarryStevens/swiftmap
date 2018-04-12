export default function data(data, key){
  // if no data is passed, then this is a getter function
  if (!data) {
    return this.meta.tab;
  }

  // if the key is not a function, set the key property of each datum matches its index
  if (key && (Object.prototype.toString.call(key) !== "[object Function]" || typeof key !== "function")) {
    console.warn("The key must be specified as a function. The key will default to (d, i) => i");
    key = function(d, i){ return i; }
  }

  // if data is passed, then this is a setter function
  this.meta.tab = data;

  // if a key is passed, add the key to the data
  // otherwise, assign the index to the key property
  this.meta.tab.forEach(function(d, i, arr){
    d.key = key ? key(d, i, arr) : i;
    return d;
  });
  
  return this;
}