export default function data(data, key){
  // if no data is passed, then this is a getter function
  if (!data) {
    return this.meta.tab;
  }

  // if data is passed, then this is a setter function
  this.meta.tab = data;

  // if a key is passed, add the key to the data
  if (key){

    // for loops are more efficient that forEach
    var arr = this.meta.tab,
      out = [];
    for (var i = 0, n = arr.length; i < n; i++){
      arr[i].key = key(arr[i]);
      out.push(arr[i]);
    }
    this.meta.tab = out;

  }
  
  return this;
}