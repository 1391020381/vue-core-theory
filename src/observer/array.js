// 修改数组的原型方法
// arrayProtoCopy.__proto__ === Array.prototype
// arrayProto继承了Array.prototype上的原型方法
// Object.create: 创建一个新对象，使用一个已经存在的对象作为新创建对象的原型
// Object.create的原理大概如下：
// function create (proto) {
//   function Fn () {
//
//   }
//
//   Fn.prototype = proto;
//   return new Fn();
// }

import Dep from './dep';

const arrayProto = Array.prototype;
export const arrayProtoCopy = Object.create(arrayProto);

const methods = ['push', 'pop', 'unshift', 'shift', 'splice', 'reverse', 'sort'];

export function dependArray (data) {
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      // item也可能是对象，会对对象再次进行依赖收集，此时和defineReactive中收集的dep不是同一个
      item.__ob__?.dep.depend();
      dependArray(item);
    }
  }
}

methods.forEach(method => {
  arrayProtoCopy[method] = function (...args) {
    const result = arrayProto[method].apply(this, args);
    // data中的数组会调用这里定义的方法，this指向该数组
    const ob = this.__ob__;
    let inserted;
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args;
        break;
      case 'splice': // splice(index,deleteCount,item1,item2)
        inserted = args.slice(2);
        break;
    }
    if (inserted) {ob.observeArray();}
    ob.dep.notify();
    return result;
  };
});
