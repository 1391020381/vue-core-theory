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

// noop: short for no operation
// https://en.wikipedia.org/wiki/NOP_(code)
export function noop () {

}

function makeMap (str) {
  const tags = str.split(',');
  const map = tags.reduce((memo, tag) => {
    memo[tag] = true;
    return memo;
  }, {});
  return function (key) {
    return map[key];
  };
}

export const isReservedTag = makeMap('a,div,span,p,input,textarea,ul,li,button');

export function isObject (value) {
  return typeof value === 'object' && value != null;
}
