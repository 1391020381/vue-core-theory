import { arrayProtoCopy, dependArray } from './array';
import { defineProperty } from '../shared/utils';
import Dep from './dep';

function observe (data) {
  // 如果是对象，会遍历对象中的每一个元素
  if (typeof data === 'object' && data !== null) {
    if (data.__ob__) {
      return;
    }
    return new Observer(data);
  }
}

function defineReactive (target, key, value) {
  // 继续对value进行监听，如果value还是对象的话，会继续new Observer，执行defineProperty来为其设置get/set方法
  // 否则会在observe方法中什么都不做
  const childOb = observe(value);
  const dep = new Dep();
  Object.defineProperty(target, key, {
    get () {
      if (Dep.target) { // 每个属性都收集watcher
        // 为对象的每一个属性收集依赖
        dep.depend();
        if (childOb) {
          // 收集数组的依赖，在数组更新的时候，会调用notify方法，通知数组更新
          // 这里是定义在Observer中的另一个新的dep
          childOb.dep.depend();
          // 对于数组中依旧有数组的情况，需要对其再进行依赖收集
          dependArray(value);
        }
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
    // 这里为对象额外收集了一个dep,是为了之后实现$set方法时进行利用
    this.dep = new Dep(); // data中对象和数组创建dep
    // 为data中的每一个对象和数组都添加__ob__属性，方便直接可以通过data中的属性来直接调用Observer实例上的属性和方法
    defineProperty(this.value, '__ob__', this);
    // 这里会对数组和对象进行单独处理，因为为数组中的每一个索引都设置get/set方法性能消耗比较大
    if (Array.isArray(value)) {
      Object.setPrototypeOf(value, arrayProtoCopy);
      this.observeArray(value);
    } else {
      this.walk();
    }
  }

  walk () {
    for (const key in this.value) {
      if (this.value.hasOwnProperty(key)) {
        defineReactive(this.value, key, this.value[key]);
      }
    }
  }

  observeArray (value) {
    for (let i = 0; i < value.length; i++) {
      observe(value[i]);
    }
  }
}

function set (target, key, value) {
  if (Array.isArray(target)) {// 数组直接调用splice方法
    target.splice(key, 0, value);
    return value;
  }
  if (typeof target === 'object' && target != null) { // 对象
    const ob = target.__ob__;
    // 通过defineReactive为对象新加的属性添加set/get方法，并进行依赖收集
    defineReactive(target, key, value);
    // 对象更新后通知视图更新
    ob.dep.notify();
    return value;
  }
}

function del (target, key) {
  if (Array.isArray(target)) {
    // 代用splice删除元素
    target.splice(key, 1);
    return;
  }
  if (typeof target === 'object' && target != null) { // 对象
    const ob = target.__ob__;
    delete target.key;
    // 删除对象属性后通知视图更新
    ob.dep.notify();
  }
}

export {
  observe,
  set,
  del
};
