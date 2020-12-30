import { arrayProtoCopy } from './array';
import { defineProperty } from '../shared/utils';
import Dep from './dep';

function observe (data) {
  // 如果是对象，会遍历对象中的每一个元素
  if (typeof data === 'object' && data !== null) {
    if (data.__ob__) {
      return;
    }
    new Observer(data);
  }
}

function defineReactive (target, key) {

  let value = target[key];
  // 继续对value进行监听，如果value还是对象的话，会继续new Observer，执行defineProperty来为其设置get/set方法
  // 否则会在observe方法中什么都不做
  observe(value);
  const dep = new Dep();
  Object.defineProperty(target, key, {
    get () {
      if (Dep.target) { // 每个属性都收集watcher
        dep.addSub(Dep.target);
      }
      return value;
    },
    set (newValue) {
      if (newValue !== value) {
        // 新加的元素也可能是对象，继续为新加对象的属性设置get/set方法
        observe(newValue);
        // 这样写会新将value指向一个新的值，而不会影响target[key]
        value = newValue;
        dep.notify();
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
    // 为data中的每一个对象和数组都添加__ob__属性，方便直接可以通过data中的属性来直接调用Observer实例上的属性和方法
    defineProperty(this.value, '__ob__', this);
    // 这里会对数组和对象进行单独处理，因为为数组中的每一个索引都设置get/set方法性能消耗比较大
    if (Array.isArray(value)) {
      Object.setPrototypeOf(value, arrayProtoCopy);
      this.observeArray();
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

  observeArray () {
    for (let i = 0; i < this.value.length; i++) {
      observe(this.value[i]);
    }
  }
}

export {
  observe
};
