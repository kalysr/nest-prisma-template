export function buildMap<T, K>(arr: T[], getKey: (v: T) => K) {
  const map = new Map<K, T>();
  arr.forEach((element) => map.set(getKey(element), element));
  return map;
}
