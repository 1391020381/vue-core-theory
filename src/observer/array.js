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

import { observe } from './index';

const arrayProto = Array.prototype;
export const arrayProtoCopy = Object.create(arrayProto);

const methods = ['push', 'pop', 'unshift', 'shift', 'splice', 'reverse', 'sort'];

export function observeArray (array) {
  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    observe(item);
  }
}

methods.forEach(method => {
  arrayProtoCopy[method] = function (...args) {
    const result = arrayProto[method].call(this, ...args);
    console.log('change array value');
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
    observeArray(inserted);
    return result;
  };
});
