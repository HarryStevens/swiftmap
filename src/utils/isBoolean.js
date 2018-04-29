export default function isBoolean(bool){
  return !!bool && typeof(bool) == typeof(true);
}