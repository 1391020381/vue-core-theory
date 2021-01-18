function updateProperties (vNode, oldProps = {}) { // 老节点和新节点的属性
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
      el.removeAttribute(key);
    }
  }
  const style = oldProps.style || {};
  const newStyle = props.style || {};
  // 删除老节点中多余的样式
  for (const key in style) {
    if (!newStyle.hasOwnProperty(key) && style.hasOwnProperty(key)) {
      el.style[key] = '';
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
    if (oldVNode.tag !== vNode.tag) { // 不相等直接替换
      const newEle = createElement(vNode);
      replaceChild(newEle, oldVNode.el);
      return newEle;
    }
    if (!oldVNode.tag) { // 文本节点
      oldVNode.el.textContent = vNode.text;
      return oldVNode.el;
    }
    // 元素相同，需要比较子元素
    const el = vNode.el = oldVNode.el;
    updateProperties(vNode, oldVNode.props);
    const oldChildren = oldVNode.children;
    const newChildren = vNode.children;
    // 老的有，新的没有，将老的设置为空
    // 老的没有，新的有，为老节点插入多有的新节点
    // 老的和新的都有,遍历每一个进行比对
    if (!oldChildren.length && newChildren.length) {
      for (let i = 0; i < newChildren; i++) {
        const child = newChildren[i];
        el.appendChild(createElement(child));
      }
      return;
    }
    if (oldChildren.length && !newChildren.length) {
      return el.innerHTML = '';
    }
    if (oldChildren.length && newChildren.length) {
      updateChildren(oldChildren, newChildren, el);
    }
    return el;
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

  function makeMap () {
    const map = {};
    for (let i = 0; i < oldChildren.length; i++) {
      const child = oldChildren[i];
      child.key && (map[child.key] = i);
    }
    return map;
  }

  // 将老节点的key和索引进行映射，之后可以直接通过key找到索引，然后通过索引找到对应的元素
  // 这样提前做好映射关系，可以将查找的时间复杂度降到O(1)
  const map = makeMap();
  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if (oldStartVNode == null) {
      oldStartVNode = oldChildren[++oldStartIndex];
      continue;
    } else if (oldEndVNode == null) {
      oldEndVNode = oldChildren[--oldEndIndex];
      continue;
    } else if (isSameVNode(oldStartIndex, newStartIndex)) { // 头和头相等
      // 1. 可能是文本节点：需要继续比对文本节点
      // 2. 可能是元素：先比对元素的属性，然后再比对子节点
      patch(oldStartVNode, newStartVNode);
      oldStartVNode = oldChildren[++oldStartIndex];
      newStartVNode = newChildren[++newStartIndex];
    } else if (isSameVNode(oldEndVNode, newEndVNode)) { // 尾和尾相等
      patch(oldEndVNode, newEndVNode);
      oldEndVNode = oldChildren[--oldEndIndex];
      newEndVNode = newChildren[--newEndIndex];
    } else if (isSameVNode(oldStartVNode, newEndVNode)) { // 将开头元素移动到了末尾：尾和头相同
      // 老节点：需要将头节点对应的元素移动到尾节点之后
      parent.insertBefore(oldStartVNode, oldEndVNode.el.nextSibling);
      patch(oldStartVNode, newEndVNode);
      oldStartVNode = oldChildren[++oldStartIndex];
      newEndVNode = newChildren[--newEndIndex];
    } else if (isSameVNode(oldEndVNode, newStartVNode)) { // 将结尾元素移动到了开头
      // A B C D
      // D A B C
      // 老节点： 将尾指针元素插入到头指针之前
      parent.insertBefore(oldEndVNode.el, oldStartVNode.el);
      patch(oldEndVNode, newStartVNode);
      oldEndVNode = oldChildren[--oldEndIndex];
      newStartVNode = newChildren[++newStartIndex];
    } else {
      // 1. 用key来进行寻找，找到将其移动到头节点之前
      // 2. 没有找到，将新头节点插入到老头节点之前
      let moveIndex = map[newStartVNode.key];
      if (moveIndex != null) { // 找到了
        const moveVNode = oldChildren[moveIndex];
        parent.insertBefore(moveVNode.el, oldStartVNode.el);
        oldChildren[moveIndex] = null; // 将移动这项标记为null，之后跳过，不再进行比对
        // 还有对其属性和子节点再进行比较
        patch(moveVNode, newStartVNode);
      } else {
        parent.insertBefore(createElement(newStartVNode), oldStartVNode.el);
      }
      newStartVNode = newChildren[++newStartIndex];
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
  // 老节点中从头指针到尾指针为多余的元素，需要删除掉
  for (let i = oldStartIndex; i <= oldEndIndex; i++) {
    const child = oldChildren[i];
    parent.removeChild(child.el);
  }
}
