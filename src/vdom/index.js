import { isReservedTag } from '../shared/utils';

function vNode (tag, props, key, children, text, componentOptions) {
  return {
    tag,
    props,
    key,
    children,
    text,
    componentOptions
  };
}

function createVComponent (vm, tag, props, key, children) {
  console.log(tag);
  // components属性会最终合并到实例上
  const BaseCtor = vm.$options._base;
  // 这里用BaseCtor和vm有什么区别？
  let Ctor = BaseCtor.options.components[tag];
  // let Ctor = vm.$options.components[tag];
  // 组件components选项中定义的组件是对象，需要通过Vue.extend来创建出Vue的子类，之后new Sub()，执行实例的_init方法来渲染组件
  if (typeof Ctor === 'object') {
    Ctor = BaseCtor.extend(Ctor);
  }

  props.hook = {
    init (vNode) {
      const child = vNode.componentInstance = new Ctor();
      // 挂载子组件
      child.$mount();
    }
  };
  return vNode(`vue-component-${Ctor.cid}-${tag}`, props, key, undefined, undefined, { Ctor, children });
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
