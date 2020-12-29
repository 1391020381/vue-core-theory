function vNode (tag, props, key, children, text) {
  return { tag, props, key, children, text };
}

// 这其实是一个递归函数 _c 创建标签对应的虚拟节点并返回
// _c('div',{id: 'app'},_c('span',{id:'hh'},_v('hh' + _s(name))))
function createVElement (tag, props = {}, ...children) {
  const key = props.key;
  delete props.key;
  return vNode(tag, props, key, children);
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

function createTextVNode (text) {
  return vNode(undefined, undefined, undefined, undefined, text);
}

export function renderMixin (Vue) {
  Vue.prototype._c = createVElement;
  Vue.prototype._v = createTextVNode;
  Vue.prototype._s = stringify;
  Vue.prototype._render = function () {
    const vm = this;
    const { render } = vm.$options;
    return render.call(vm);
  };
}
