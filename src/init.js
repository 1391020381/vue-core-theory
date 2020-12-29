import initState from './state';
import { compileToFunctions } from './compiler';
import { callHook, mountComponent } from './lifecycle';
import mergeOptions from './shared/mergeOptions';

/**
 * 将字符串处理为dom元素
 * @param el
 * @returns {Element|*}
 */
function query (el) {
  if (typeof el === 'string') {
    return document.querySelector(el);
  }
  return el;
}

function initMixin (Vue) {
  Vue.prototype._init = function (options) {
    const vm = this;
    vm.$options = mergeOptions(vm.constructor.options, options);
    callHook(vm, 'beforeCreate');
    initState(vm);
    callHook(vm, 'created');
    const { el } = vm.$options;
    // el选项存在，会将el通过vm.$mount方法进行挂载
    // el选项如果不存在，需要手动调用vm.$mount方法来进行组件的挂载
    if (el) {
      vm.$mount(el);
    }
  };
  Vue.prototype.$mount = function (el) {
    const vm = this;
    vm.$el = el = query(el);
    const options = vm.$options;
    if (!options.render) { // 有render函数，优先处理render函数
      let template = options.template;
      if (!template && el) {
        template = el.outerHTML;
      }
      options.render = compileToFunctions(template);
    }
    mountComponent(vm);
  };
}

export default initMixin;
