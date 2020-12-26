function observe (data) {
  // 如果是对象，会遍历对象中的每一个元素
  if (typeof data === 'object' && data !== null) {
    new Observer(data);
  }
}

function defineProperty (target, key) {
  let value = target[key];
  Object.defineProperty(target, key, {
    get () {
      return value;
    },
    set (newValue) {
      if (newValue !== value) {
        // 这样写会新将value指向一个新的值，而不会影响target[key]
        value = newValue;
      }
    }
  });
}

/**
 * 为data中的所有对象设置`set/get`方法
 */
class Observer {
  constructor (data) {

  }

  walk (data) {
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        defineProperty(data, key);
      }
    }
  }
}

export {
  observe
};
