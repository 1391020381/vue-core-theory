// 最终使用:
// createVElement('div',{id:"app"},createVElement('span',{class: "xx"}, createTextVNode('hh' + stringify(name))))

function vNode (tag, props, key, children, text) {
  return {
    tag,
    props,
    key,
    children,
    text
  };
}

// 生成一个标签对应的虚拟节点：也就是返回一个对象
const _c = function createVElement (tag, props = {}, ...children) {
  const { key } = props;
  delete props.key;
  return vNode(tag, props, key, children);
};

const _v = function createTextVNode (text) {
  return vNode(undefined, undefined, undefined, undefined, text);
};

const _s = function stringify (value) {
  if (value == null) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value;
};

module.exports = {
  _c,
  _v,
  _s
};





