import mergeOptions from '../shared/merge-options';

export function initExtend (Vue) {
  // 创建一个子类来继承父类
  let cid = 0;
  Vue.extend = function (extendOptions) {
    const Super = this;
    const Sub = function VueComponent () {
      // 会根据原型链进行查找，找到Super.prototype.init方法
      this._init();
    };
    Sub.cid = cid++;
    Sub.prototype = Object.create(Super.prototype);
    // 此时prototype为一个对象，会失去原来的值
    Sub.prototype.constructor = Sub;
    Sub.options = mergeOptions(Super.options, extendOptions);
    Sub.component = Super.component;
    return Sub;
  };
}
