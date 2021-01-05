import mergeOptions from '../shared/merge-options';

export function initExtend (Vue) {
  Vue.extend = function (extendOptions) {
    const Super = this;
    const Sub = function VueComponent (options) {
      // 会通过原型链调用Super类原型上的_init方法
      this._init(options);
    };
    // 继承Vue的原型方法
    Sub.prototype = Object.create(Super.prototype);
    Sub.constructor = Sub;
    Sub.options = mergeOptions(Super.options, extendOptions);
    Sub.component = Super.component;
    return Sub;
  };
}
