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
  vm._update(vm._render());
}
