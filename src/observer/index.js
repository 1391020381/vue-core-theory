import { arrayProtoCopy, observeArray } from './array';

function observe (data) {
  // 如果是对象，会遍历对象中的每一个元素
  if (typeof data === 'object' && data !== null) {
    new Observer(data);
  }
}

function defineReactive (target, key) {
  let value = target[key];
  // 继续对value进行监听，如果value还是对象的话，会继续new Observer，执行defineProperty来为其设置get/set方法
  // 否则会在observe方法中什么都不做
  observe(value);
  Object.defineProperty(target, key, {
    get () {
      console.log('get value');
      return value;
    },
    set (newValue) {
      if (newValue !== value) {
        // 新加的元素也可能是对象，继续为新加对象的属性设置get/set方法
        observe(newValue);
        // 这样写会新将value指向一个新的值，而不会影响target[key]
        console.log('set value');
        value = newValue;
      }
    }
  });
}

/**
 * 为data中的所有对象设置`set/get`方法
 */
class Observer {
  constructor (value) {
    this.value = value;
    // 这里会对数组和对象进行单独处理，因为为数组中的每一个索引都设置get/set方法性能消耗比较大
    if (Array.isArray(value)) {
      // TODO: observeArray是Observer中的方法，并且需要为data添加__ob__来表示Observer实例，方便之后直接通过Vue中data中值来直接进行调用
      // TODO: 将公共方法进行提取
      Object.setPrototypeOf(value, arrayProtoCopy);
      observeArray(value);
    } else {
      this.walk();
    }
  }

  walk () {
    for (const key in this.value) {
      if (this.value.hasOwnProperty(key)) {
        defineReactive(this.value, key);
      }
    }
  }
}

export {
  observe
};
