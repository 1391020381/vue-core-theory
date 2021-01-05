import mergeOptions from '../shared/merge-options';
import { initExtend } from './extend';

export function initGlobalApi (Vue) {
  Vue.options = {};

  Vue.options._base = Vue;
  Vue.options.components = {};
  initExtend(Vue);
  Vue.mixin = function (mixin) {
    this.options = mergeOptions(this.options, mixin);
  };

  /**
   * 创建全局组件
   *
   * @param id 组件标识
   * @param definition 组件定义
   */
  Vue.component = function (id, definition) {
    const key = definition.name = definition.name || id;
    // Vue.extend会返回Vue子类的构造函数
    this.options.components[key] = Vue.extend(definition);
  };
}
