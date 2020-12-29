import mergeOptions from '../shared/mergeOptions';

export function initGlobalApi (Vue) {
  Vue.options = {}; // Vue全局的一些选项，可以在任意组件中使用
  Vue.mixin = function (mixin) {
    const options = this.options = mergeOptions(this.options, mixin);
  };
}
