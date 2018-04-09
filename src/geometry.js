export default function geometry(data, key){
	// if no data is passed, then this is a getter function
	if (!data) {
		return this.data.geo;
	}

	// if data is passed, then this is a setter function
	this.data.geo = data;

	// if a key is passed, add the key to the data
	if (key){

		var arr = this.data.geo.objects[Object.keys(this.data.geo.objects)[0]].geometries,
			out = [];
		for (var i = 0, n = arr.length; i < n; i++){
			arr[i].properties.key = key(arr[i]);
			out.push(arr[i]);
		}
		this.data.geo.objects[Object.keys(this.data.geo.objects)[0]].geometries = out;

	}
  
  return this;
}