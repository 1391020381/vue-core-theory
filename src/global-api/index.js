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
    definition.name = definition.name || id;
    definition = this.options._base.extend(definition);
    this.options.components[id] = definition;
  };
}
