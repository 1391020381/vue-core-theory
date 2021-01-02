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
        const el = vNode.el = oldVNode.el;
        updateProperties(vNode, oldVNode.props);
        const oldChildren = oldVNode.children;
        const newChildren = vNode.children;
        if (oldChildren.length === 0) { // 老节点没有
          for (let i = 0; i < newChildren; i++) {
            const child = newChildren[i];
            el.appendChild(createElement(child));
          }
          return;
        }
        if (newChildren.length === 0) { // 新节点没有
          el.innerHTML = '';
          return;
        }
        // 老节点和新节点都有，进行DOM diff
        updateChildren(oldChildren, newChildren, el);
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

function isSameVNode (oldVNode, newVNode) {
  return oldVNode.key === newVNode.key && oldVNode.tag === newVNode.tag;
}

function updateChildren (oldChildren, newChildren, parent) {
  // 更新子节点:
  //  1. 一层一层进行比较，如果发现有一层不一样，直接就会用新节点的子集来替换父节点的子集。
  //  2. 比较时会采用双指针，对常见的操作进行优化
  let oldStartIndex = 0,
    oldStartVNode = oldChildren[0],
    oldEndIndex = oldChildren.length - 1,
    oldEndVNode = oldChildren[oldEndIndex];
  let newStartIndex = 0,
    newStartVNode = newChildren[0],
    newEndIndex = newChildren.length - 1,
    newEndVNode = newChildren[newEndIndex];
  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if (isSameVNode(oldStartIndex, newStartIndex)) { // 头和头相等
      // 1. 可能是文本节点：需要继续比对文本节点
      // 2. 可能是元素：先比对元素的属性，然后再比对子节点
      patch(oldStartVNode, newStartVNode);
      oldStartVNode = oldChildren[++oldStartIndex];
      newStartVNode = newChildren[++newStartIndex];
    } else if (isSameVNode(oldEndVNode, newEndVNode)) { // 尾和尾相等
      patch(oldEndVNode, newEndVNode);
      oldEndVNode = oldChildren[++oldEndIndex];
      newEndVNode = newChildren[++newEndIndex];
    } else if (isSameVNode(oldStartVNode, newEndVNode)) { // 将开头元素移动到了末尾：尾和头相同
      // 老节点：需要将头节点对应的元素移动到尾节点之后
      parent.appendChild(oldStartVNode.el);
      patch(oldStartVNode, newEndVNode);
      oldStartVNode = oldChildren[++oldStartIndex];
      newEndVNode = newChildren[++newEndIndex];
    } else if (isSameVNode(oldEndVNode, newStartVNode)) { // 将结尾元素移动到了开头
      // A B C D
      // D A B C
      // 老节点： 将尾指针元素插入到头指针之前
      parent.insertBefore(oldEndVNode.el, oldStartVNode.el);
      patch(oldEndVNode, newStartVNode);
      oldEndVNode = oldChildren[++oldEndIndex];
      newStartVNode = newChildren[++newStartIndex];
    } else {
      break;
    }
  }
  // 循环结束后:
  // 结尾插入：剩余的新节点要插入到老节点的尾指针之后
  // 开头插入：剩余节点要插入到老节点的头指针之前
  // 总结：插入到尾指针的下一个指针对应的元素之前
  for (let i = newStartIndex; i <= newEndIndex; i++) {
    const child = newChildren[i];
    const refEle = oldChildren[oldEndIndex + 1] || null;
    parent.insertBefore(createElement(child), refEle);
  }
}
