export default function keepNumber(x){
	return x.replace(/[^\d.-]/g, "");
}