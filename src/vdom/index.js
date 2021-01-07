import { isReservedTag } from '../shared/utils';

function vNode (tag, props, key, children, text, componentOptions) {
  return {
    tag,
    props,
    key,
    children,
    text,
    componentOptions, // 组件虚拟节点添加了componentOptions属性来保存
  };
}

function createVComponent (vm, tag, props, key, children) {
  const baseCtor = vm.$options._base;
  // 在生成父虚拟节点的过程中，遇到了子组件的自定义标签。它的定义放到了父组件的components中，所有通过父组件的$options来进行获取
  // 这里包括全局组件和自定义组件，内部通过原型链进行了合并
  let Ctor = vm.$options.components[tag];
  if (typeof Ctor === 'object') {
    Ctor = baseCtor.extend(Ctor);
  }
  props.hook = { // 在渲染真实节点时会调用init钩子函数
    init (vNode) {
      const child = vNode.componentInstance = new Ctor();
      child.$mount();
    }
  };
  return vNode(`vue-component-${Ctor.id}-${tag}`, props, key, undefined, undefined, { Ctor, children });
}

function createVElement (tag, props = {}, ...children) {
  const vm = this;
  const { key } = props;
  delete props.key;
  if (isReservedTag(tag)) {
    return vNode(tag, props, key, children);
  } else {
    return createVComponent(vm, tag, props, key, children);
  }
}

function createTextVNode (text) {
  return vNode(undefined, undefined, undefined, undefined, text);
}

function stringify (value) {
  if (value == null) {
    return '';
  } else if (typeof value === 'object') {
    return JSON.stringify(value);
  } else {
    return value;
  }
}

export function renderMixin (Vue) {
  Vue.prototype._c = createVElement;
  Vue.prototype._v = createTextVNode;
  Vue.prototype._s = stringify;
  Vue.prototype._render = function () {
    const vm = this;
    // 执行选项中的render方法，指定this为Vue实例
    const { render } = vm.$options;
    return render.call(vm);
  };
}
