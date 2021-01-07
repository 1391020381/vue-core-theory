import mergeOptions from '../shared/merge-options';
import { initExtend } from './extend';

export function initGlobalApi (Vue) {
  Vue.options = {};
  // 最终会合并到实例上，可以通过vm.$options._base直接使用
  Vue.options._base = Vue;
  // 定义全局组件
  Vue.options.components = {};
  initExtend(Vue);
  Vue.mixin = function (mixin) {
    this.options = mergeOptions(this.options, mixin);
  };

  // 1. 通过Vue.extend创建了组件的构造函数
  // 2. 之后会new Sub() 对子组件进行初始化，由于没有指定el选项，需要手动执行$mount方法进行挂载
  // 3. $mount在没有参数传入的情况下，最终会返回template中的根节点，并赋值给子组件实例的vm.$el属性
  // 4. 父组件在创建真实节点的时候，会执行new Sub(),并将返回vm.$el,最终append到父`DOM`节点中
  Vue.components = function (id, definition) {
    const name = definition.name = definition.name || id;
    definition = this.options._base.extend(definition);
    this.options.components[name] = definition;
  };
}
