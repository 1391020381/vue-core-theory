function observe (data) {
  // 如果是对象，会遍历对象中的每一个元素
  if (typeof data === 'object' && data !== null) {
    new Observer(data);
  }
}

function defineProperty (target, key) {
  Object.defineProperty(target, key, {});
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
        let value = data[key];
        // get/set方法会更改范围内的value
        Object.defineProperty(data, key, {
          get () {
            // 这样会造成死循环
            // return data[key]
            return value;
          },
          set (newValue) {
            // 不能这样写，这样又会触发data中key对应属性的get方法
            // data[key] = newValue;
            if (newValue !== value) {
              value = newValue;
            }
          }
        });
      }
    }
  }
}

export {
  observe
};
