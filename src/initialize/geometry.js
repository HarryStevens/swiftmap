export default function geometry(data, key){
  // if no data is passed, then this is a getter function
  if (!data) {
    return this.meta.geo;
  }

  // if data is passed, then this is a setter function
  this.meta.geo = data;

  // if a key is passed, add the key to the data
  if (key){

    var arr = this.meta.geo.objects[Object.keys(this.meta.geo.objects)[0]].geometries,
      out = [];
    for (var i = 0, n = arr.length; i < n; i++){
      arr[i].properties.key = key(arr[i]);
      out.push(arr[i]);
    }
    this.meta.geo.objects[Object.keys(this.meta.geo.objects)[0]].geometries = out;

  }

  // without a key, just assign the index
  else {

    this.meta.geo.objects[Object.keys(this.meta.geo.objects)[0]].geometries.forEach(function(d, i){
      d.properties.key = i;
      return d;
    });
    
  }
  
  return this;
}