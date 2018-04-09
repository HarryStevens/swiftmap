export default function data(data, key){
	// if no data is passed, then this is a getter function
	if (!data) {
		return this.data.tab;
	}

	// if data is passed, then this is a setter function
	this.data.tab = data;

	// if a key is passed, add the key to the data
	if (key){

		// for loops are more efficient that forEach
		var arr = this.data.tab,
			out = [];
		for (var i = 0, n = arr.length; i < n; i++){
			arr[i].key = key(arr[i]);
			out.push(arr[i]);
		}
		this.data.tab = out;

	}
  
  return this;
}