function vNode (tag, props, key, children, text) {
  return {
    tag,
    props,
    key,
    children,
    text
  };
}

function createVElement (tag, props = {}, ...children) {
  const { key } = props;
  delete props.key;
  return vNode(tag, props, key, children);
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
