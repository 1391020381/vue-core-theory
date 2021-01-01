import { patch } from './vdom/patch';
import Watcher from './observer/watcher';
import { nextTick } from './shared/next-tick';

export function lifecycleMixin (Vue) {
  Vue.prototype._update = function (vNode) {
    const vm = this;
    vm.$el = patch(vm.$el, vNode);
  };
  Vue.prototype.$nextTick = function (cb) {
    const vm = this;
    nextTick(cb);
  };
}

export function mountComponent (vm) {
  callHook(vm, 'beforeMount');

  function updateComponent () {
    vm._update(vm._render());
  }

  new Watcher(vm, updateComponent, () => {}, { render: true });
  callHook(vm, 'mounted');
}

export function callHook (vm, hook) {
  const handlers = vm.$options[hook];
  if (handlers) {
    handlers.forEach(handler => handler.call(vm));
  }
}
