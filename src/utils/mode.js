// returns the mode from an array of numbers
export default function mode(arr){
  return arr.sort(function(a, b){
  	return arr.filter(function(v){ return v === a; }).length - arr.filter(function(v){ return v === b; }).length
  }).pop();
}