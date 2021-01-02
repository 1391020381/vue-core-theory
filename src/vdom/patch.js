function updateProperties (vNode, oldProps) { // 老节点和新节点的属性
  const { el, props } = vNode;
  // 用新节点替换老节点中的属性
  for (const key in props) { // 为真实DOM设置新节点的所有属性
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
  // 如果老节点中有，而新节点中没有，需要将其删除
  for (const key in oldProps) {
    if (oldProps.hasOwnProperty(key) && !props.hasOwnProperty(key)) {
      if (key === 'style') {
        el.style[key] = '';
      } else {
        el.removeAttribute(key);
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

function replaceChild (oldEl, newEl) {
  const parentNode = oldEl.parentNode;
  parentNode.replaceChild(newEl, oldEl);
}

export function patch (oldVNode, vNode) {
  if (oldVNode.nodeType) { // 旧的节点为真实节点
    // 将虚拟节点创建为真实节点，并插入到dom中
    const el = createElement(vNode);
    const parentNode = oldVNode.parentNode;
    parentNode.insertBefore(el, oldVNode.nextSibling);
    parentNode.removeChild(oldVNode);
    return el;
  } else { // 新旧节点都为虚拟节点，要进行dom diff
    if (oldVNode.tag && vNode.tag) { // 文本或标签
      if (oldVNode.tag === vNode.tag) {
        // 1. 更新属性
        // 2. 更新子节点
        vNode.el = oldVNode.el;
        updateProperties(vNode, oldVNode.props);
      } else { // 用老节点直接替换新节点
        replaceChild(oldVNode.el, createElement(vNode));
      }
    } else if (oldVNode.tag) {
      replaceChild(oldVNode.el, createElement(vNode));
    } else if (vNode.tag) { // 老节点是文本节点，新节点是元素
      replaceChild(oldVNode.el, createElement(vNode));
    } else { // 俩节点个都是文本节点
      oldVNode.el.textContent = vNode.text;
    }
  }
}
