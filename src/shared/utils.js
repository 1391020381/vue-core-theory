export function defineProperty (target, key, value) {
  Object.defineProperty(target, key, {
    configurable: false,
    enumerable: false,
    value
  });
}

export function proxy (target, key, source) {
  Object.defineProperty(target, key, {
    get () {
      return source[key];
    },
    set (value) {
      source[key] = value;
    }
  });
}

export function isObject (value) {
  return typeof value === 'object' && value != null;
}
