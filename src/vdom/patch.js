/**
 * 更新节点的属性
 * @param vNode
 */
function updateProperties (vNode) {
  const { el, props } = vNode;
  for (const key in props) {
    if (props.hasOwnProperty(key)) {
      const value = props[key];
      if (key === 'style') {
        Object.keys(value).forEach(styleKey => {
          el.style[styleKey] = value[styleKey];
        });
      } else {
        el.setAttribute(key, value);
      }
    }
  }
}

/**
 * 将虚拟节点处理成真实节点，并将其作为el属性放到vNode上，并将el返回
 * @param vNode
 * @returns {*|Text}
 */
function createElement (vNode) {
  if (typeof vNode.tag === 'string') {
    vNode.el = document.createElement(vNode.tag);
    updateProperties(vNode);
    vNode.children.forEach(child => {
      vNode.el.appendChild(createElement(child));
    });
  } else {
    vNode.el = document.createTextNode(vNode.text);
  }
  return vNode.el;
}

export function patch (oldVNode, vNode) {
  // 首次渲染，将虚拟节点生成真实节点，并用它替换原来的dom
  // 替换逻辑：插入到原来的节点后面，然后删除原节点
  const el = createElement(vNode);
  const parentNode = oldVNode.parentNode;
  parentNode.insertBefore(el, oldVNode.nextSibling);
  parentNode.removeChild(oldVNode);
}
