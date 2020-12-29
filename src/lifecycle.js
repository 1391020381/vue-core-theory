import { patch } from './vdom/patch';

export function lifecycleMixin (Vue) {
  Vue.prototype._update = function (vNode) {
    // 将虚拟节点生成真实节点
    const vm = this;
    console.log('vNode', vNode);
    patch(vm.$el, vNode);
  };
}

export function mountComponent (vm) {
  callHook(vm, 'beforeMount');
  vm._update(vm._render());
  callHook(vm, 'mounted');
}

/**
 * 调用声明周期函数
 * @param vm
 * @param hook
 */
export function callHook (vm, hook) {
  const handlers = vm.$options[hook];
  if (!handlers) {return;}
  for (let i = 0; i < handlers.length; i++) {
    const handler = handlers[i];
    handler.call(vm);
  }
}
