function updateProperties (vNode) {
  const { el, props } = vNode;
  for (const key in props) {
    if (props.hasOwnProperty(key)) {
      const value = props[key];
      if (key === 'style') {
        for (const styleKey in value) {
          if (value.hasOwnProperty(styleKey)) {
            el.style[styleKey] = value[styleKey];
          }
        }
      } else {
        el.setAttribute(key, value);
      }
    }
  }
}

function createElement (vNode) {
  if (typeof vNode.tag === 'string') {
    vNode.el = document.createElement(vNode.tag);
    updateProperties(vNode);
    for (let i = 0; i < vNode.children.length; i++) {
      const child = vNode.children[i];
      vNode.el.appendChild(createElement(child));
    }
  } else {
    vNode.el = document.createTextNode(vNode.text);
  }
  return vNode.el;
}

export function patch (oldVNode, vNode) {
  // 将虚拟节点创建为真实节点，并插入到dom中
  const el = createElement(vNode);
  const parentNode = oldVNode.parentNode;
  parentNode.insertBefore(el, oldVNode.nextSibling);
  parentNode.removeChild(oldVNode);
  return el;
}
