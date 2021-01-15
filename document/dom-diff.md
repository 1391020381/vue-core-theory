## DOM Diff

`Vue`创建视图分为俩种情况：

1. 首次渲染，会用组件`template`转成的真实`DOM`来替换应用中的根元素
2. 当数据更新后，视图重新渲染，此时并不会重新通过组件`template`对应的虚拟节点来创建真实`DOM`，而是会用老的虚拟节点和新的虚拟节点进行比对，根据比对结果来更新`DOM`

第二种情况就是`Vue`中经常谈到的`DOM Diff`，接下来我们将详细介绍新老节点的比对过程。

### 整体思路

老的虚拟节点和新的虚拟节点是俩棵树，会对俩棵树每层中的虚拟节点进行比对操作：
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210115153619.png)

在每一层进行对比时，会分别为老节点和新节点设置头尾指针:
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210115155351.png)

整体的孩子节点比对思路如下：

* 在老的虚拟节点和新的虚拟节点的头尾指针之间都有元素时进行遍历
* 对以下情况进行优化
  * 老节点的头指针和新节点的头指针相同
  * 老节点的尾指针和新节点的尾指针相同
  * 老节点的头指针和新节点的尾指针相同
  * 老节点的尾指针和新节点的头指针相同
* 乱序排列时，要用新节点的头节点到老节点中查找，如果能找到，对其复用并移动到相应的位置。如果没有找到，将其插入到真实节点中
* 遍历完成后，将新节点头指针和尾指针之间的元素插入到真实节点中，老节点头指针和尾指针之间的元素删除

在我们渲染视图之前，需要保存当前渲染的虚拟节点。在下一次渲染视图时，它就是老的虚拟节点，要和新的虚拟节点进行对比：

```javascript
// src/lifecycle.js
Vue.prototype._update = function (vNode) {
  const vm = this;
  const preVNode = vm._vNode;
  vm._vNode = vNode;
  if (!preVNode) { // 首次渲染，没有前一次的虚拟节点
    vm.$el = patch(vm.$el, vNode);
  } else { // vm._vNode中存储了前一次的虚拟节点，进行dom diff
    patch(preVNode, vNode);
  }
};
```

下面我们实现`patch`方法中的逻辑

### 处理简单情况

在`patch`方法中，首先会判断`oldVNode`是否为真实`DOM`。如果不是，会进行`DOM diff`。

如果新的虚拟节点和老的虚拟节点标签不一样，直接用新的虚拟节点创建真实节点，然后替换老的真实节点即可：

```javascript
const vm1 = new Vue();
const html1 = `
  <div id="app">
    111
  </div>
`;
// 将模板编译为render函数
const render1 = compileToFunctions(html1);
const vNode1 = render1.call(vm1);
// 当oldVNode为DOM元素时，会用新节点直接替换老节点
patch(document.getElementById('app'), vNode1);
const html2 = `
  <span id="app">
    333
  </span>
`;
// 将新的模本编译为render函数
const render2 = compileToFunctions(html2);
// 生成新的虚拟节点
const vNode2 = render2.call(vm1);
// 老节点和新节点进行对比
patch(vNode1, vNode2);
```

上述代码会直接通过新的虚拟节点创建的真实节点来替换老的真实节点，`patch`中的代码如下：

```javascript
export function patch (oldVNode, vNode) {
  if (oldVNode.nodeType) { // 旧的节点为真实节点
    // some code...  
  } else { // 新旧节点都为虚拟节点，要进行dom diff
    if (oldVNode.tag !== vNode.tag) { // 标签不相同，直接用新节点替换老节点
      const newEle = createElement(vNode);
      replaceChild(newEle, oldVNode.el);
      return newEle;
    }
  }
}
```

如果老节点和新节点都是文本标签，那么直接用新节点的文本替换老节点即可：

```javascript
// 老的模板
const html1 = `
  <div id="app">
    111
  </div>
`;
// 新的模板
const html2 = `
  <div id="app">
    333
  </div>
`;
```

上例中的新的文本`333`会替换掉老的文本`111`，`patch`中的实现如下：

```javascript
export function patch (oldVNode, vNode) {
  if (oldVNode.nodeType) { // 旧的节点为真实节点
    // some code ...
  } else { // 新旧节点都为虚拟节点，要进行dom diff
    if (oldVNode.tag !== vNode.tag) { // 不相等直接替换
      // some code ...
    }
    if (!oldVNode.tag) { // 文本节点,tag相同，都为undefined
      oldVNode.el.textContent = vNode.text;
      return oldVNode.el;
    }
  }
}
```

当老节点和新节点的标签相同时，要更新标签对应真实元素的属性，更新规则如下：

* 用新节点中的属性替换老节点中的属性
* 删除老节点中多余的属性

```javascript
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
```

在比对完当前节点后，要继续比对孩子节点。孩子节点可能有以下情况：

1. 老节点孩子为空，新节点有孩子：将新节点的每一个孩子节点创建为真实节点，插入到老节点对应的真实父节点中
2. 老节点有孩子，新节点孩子为空：将老节点的父节点的孩子节点清空
3. 老节点和新节点都有孩子: 采用双指针进行对比

`patch`中对应的代码如下：

```javascript
export function patch (oldVNode, vNode) {
  if (oldVNode.nodeType) { // 旧的节点为真实节点
    // some code ...  
  } else { // 新旧节点都为虚拟节点，要进行dom diff
    // 元素相同，需要比较子元素
    const el = vNode.el = oldVNode.el;
    // 更新属性
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
```

下面我们的逻辑便到了`updateChildren`中。

### 比对优化

在对孩子节点的比对中，对一些常见的`DOM`操作通过双指针进行了优化：

* 列表尾部新增元素
* 列表头部新增元素
* 列表开始元素移动到末尾
* 列表结尾元素移动到开头

我们在代码中先声明需要的变量：

```javascript
function updateChildren (oldChildren, newChildren, parent) {
  let oldStartIndex = 0, // 老孩子的开始索引
    oldStartVNode = oldChildren[0], // 老孩子的头虚拟节点 
    oldEndIndex = oldChildren.length - 1, // 老孩子的尾索引
    oldEndVNode = oldChildren[oldEndIndex]; // 老孩子的尾虚拟节点
  let newStartIndex = 0, // 新孩子的开始索引
    newStartVNode = newChildren[0], // 新孩子的头虚拟节点
    newEndIndex = newChildren.length - 1, // 新孩子的尾索引
    newEndVNode = newChildren[newEndIndex]; // 新孩子的尾虚拟节点
}
```

当节点的`tag`和`key`都相同时，我们认为这俩个节点是同一个节点，可以进行复用：

```javascript
function isSameVNode (oldVNode, newVNode) {
  return oldVNode.key === newVNode.key && oldVNode.tag === newVNode.tag;
}
```

下面我们分别来讲解对应的优化逻辑

#### 尾部新增元素

我们在老节点孩子的末尾新增一个元素作为新节点，其对应的`template`如下：

```javascript
const template1 = `
  <div id="app">
    <ul>
      <li key="A" style="color:red">A</li>
      <li key="B" style="color:yellow">B</li>
      <li key="C" style="color:blue">C</li>
      <li key="D" style="color:green">D</li>
    </ul>
  </div>
`;
const template2 = `
  <div id="app">
    <ul>
      <li key="A" style="color:red">A</li>
      <li key="B" style="color:yellow">B</li>
      <li key="C" style="color:blue">C</li>
      <li key="D" style="color:green">D</li>
      <li key="E" style="color:purple">E</li>
    </ul>
  </div>
`;
```

此时`oldChildren`中的头节点和`newChildren`中的头节点相同，其比对逻辑如下：

* 继续对`oldStartVNode`和`newStartVNode`执行`patch`方法，比对它们的标签、属性、文本以及孩子节点
* `oldStartVNode`和`newStartVNode`同时后移，继续进行比对
* 遍历完老节点后，循环停止
* 将新节点中剩余的元素插入到老的虚拟节点的尾节点对应的真实节点的下一个兄弟节点`oldEndVNode.el.nextSibling`之前

画图演示下详细的比对逻辑：

![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210115172204.png)

代码如下：

```javascript
function updateChildren (oldChildren, newChildren, parent) {
  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if (isSameVNode(oldStartIndex, newStartIndex)) { // 头和头相等
      // 1. 可能是文本节点：需要继续比对文本节点
      // 2. 可能是元素：先比对元素的属性，然后再比对子节点
      patch(oldStartVNode, newStartVNode);
      oldStartVNode = oldChildren[++oldStartIndex];
      newStartVNode = newChildren[++newStartIndex];
    }
  }
  // 新节点中剩余元素插入到真实节点中
  for (let i = newStartIndex; i <= newEndIndex; i++) {
    const child = newChildren[i];
    const refEle = oldChildren[oldEndIndex + 1] || null;
    parent.insertBefore(createElement(child), refEle);
  }
}
```

#### 头部新增元素

老节点的孩子的头部新增元素`E`，此时新老节点的`template`结构如下：

```javascript
const template1 = `
  <div id="app">
    <ul>
      <li key="A" style="color:red">A</li>
      <li key="B" style="color:yellow">B</li>
      <li key="C" style="color:blue">C</li>
      <li key="D" style="color:green">D</li>
    </ul>
  </div>
`;
const template2 = `
  <div id="app">
    <ul>
      <li key="E" style="color:purple">E</li>
      <li key="A" style="color:red">A</li>
      <li key="B" style="color:yellow">B</li>
      <li key="C" style="color:blue">C</li>
      <li key="D" style="color:green">D</li>
    </ul>
  </div>
`;
```

其比对逻辑和尾部新增类似，只不过此时是`oldEndVNode`和`newEndVNode`相同：

* 继续通过`patch`比对`oldEndVNode`和`newEndVNode`的标签、属性、文本及孩子节点
* 此时要将`oldEndVNode`和`newEndVNode`同时前移，继续进行比对
* 遍历完老节点后，循环停止
* 将新节点中剩余的元素插入到老的虚拟节点的尾节点对应的真实节点的下一个兄弟节点`oldEndVNode.el.nextSibling`之前

该逻辑的示意图如下：  
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210115173756.png)

`patch`中新增代码如下：

```javascript
function updateChildren (oldChildren, newChildren, parent) {
  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if (isSameVNode(oldStartIndex, newStartIndex)) { // 头和头相等
      // some code ...  
    } else if (isSameVNode(oldEndVNode, newEndVNode)) { // 尾和尾相等
      patch(oldEndVNode, newEndVNode);
      oldEndVNode = oldChildren[--oldEndIndex];
      newEndVNode = newChildren[--newEndIndex];
    }
  }
  // some code ...  
}
```

#### 开始元素移动到末尾

在新节点中，我们将开始元素`A`移动到末尾，对应的`template`如下：

```javascript
const template1 = `
  <div id="app">
    <ul>
      <li key="A" style="color:red">A</li>
      <li key="B" style="color:yellow">B</li>
      <li key="C" style="color:blue">C</li>
      <li key="D" style="color:green">D</li>
    </ul>
  </div>
`;
const template2 = `
  <div id="app">
    <ul>
      <li key="B" style="color:yellow">B</li>
      <li key="C" style="color:blue">C</li>
      <li key="D" style="color:green">D</li>
      <li key="A" style="color:red">A</li>
    </ul>
  </div>
`;
```

此时`oldStartVNode`和`newEndVNode`相同：

* 继续通过`patch`比对`oldStartVNode`和`newEndVNode`的标签、属性、文本及孩子节点
* 将`oldStartVNode`对应的真实节点插入到`oldEndVNode`对应的真实节点之后
* `oldStartVNode`后移，`newEndVNode`前移
* 遍历完新老节点后，循环停止，此时元素已经移动到了正确的位置

用图来演示该过程：
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210115175116.png)

在`patch`方法中编写代码：

```javascript
function updateChildren (oldChildren, newChildren, parent) {
  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if (isSameVNode(oldStartIndex, newStartIndex)) { // 头和头相等
      // some code ...
    } else if (isSameVNode(oldEndVNode, newEndVNode)) { // 尾和尾相等
      // some code ...
    } else if (isSameVNode(oldStartVNode, newEndVNode)) { // 将开头元素移动到了末尾：尾和头相同
      // 老节点：需要将头节点对应的元素移动到尾节点之后
      parent.insertBefore(oldStartVNode, oldEndVNode.el.nextSibling);
      patch(oldStartVNode, newEndVNode);
      oldStartVNode = oldChildren[++oldStartIndex];
      newEndVNode = newChildren[--newEndIndex];
    }
  }
}
```

#### 末尾元素移动到开头

> 讲解到这里，大家可以先停下阅读的脚步，参考一下之前的逻辑，想想这里会如何进行比对？

在新节点中，我们将末尾元素`D`移动到开头，对应的`template`如下：

```javascript
const template1 = `
  <div id="app">
    <ul>
      <li key="A" style="color:red">A</li>
      <li key="B" style="color:yellow">B</li>
      <li key="C" style="color:blue">C</li>
      <li key="D" style="color:green">D</li>
    </ul>
  </div>
`;
const template2 = `
  <div id="app">
    <ul>
      <li key="D" style="color:green">D</li>
      <li key="A" style="color:red">A</li>
      <li key="B" style="color:yellow">B</li>
      <li key="C" style="color:blue">C</li>
    </ul>
  </div>
`;
```

此时`oldEndVNode`和`newStartVNode`相同：

* 继续通过`patch`比对`oldEndVNode`和`newStartVNode`的标签、属性、文本及孩子节点
* 将`oldEndVNode`对应的真实节点插入到`oldStartVNode`对应的真实节点之前
* `oldEndVNode`前移，`newStartVNode`后移
* 遍历完新老节点后，循环停止，此时元素已经移动到了正确的位置

画图来演示该过程：
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210115180041.png)

在`patch`方法中添加处理该逻辑的代码：

```javascript
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
    if (isSameVNode(oldStartIndex, newStartIndex)) { // 头和头相等
      // some code ...
    } else if (isSameVNode(oldEndVNode, newEndVNode)) { // 尾和尾相等
      // some code ...
    } else if (isSameVNode(oldStartVNode, newEndVNode)) { // 将开头元素移动到了末尾：尾和头相同
      // some code ...
    } else if (isSameVNode(oldEndVNode, newStartVNode)) { // 将结尾元素移动到了开头
      // 老节点： 将尾指针元素插入到头指针之前
      parent.insertBefore(oldEndVNode.el, oldStartVNode.el);
      patch(oldEndVNode, newStartVNode);
      oldEndVNode = oldChildren[--oldEndIndex];
      newStartVNode = newChildren[++newStartIndex];
    }
  }
}
```

到这里，`patch`方法中已经完成了所有的优化操作，下面我们来看下如何对比乱序的孩子节点

### 乱序比对

当进行比对的元素不满足优化条件时，就要进行乱序对比。下面是俩个乱序的`template`为例，看下它们的具体比对过程：

```javascript
const html1 = `
  <div id="app">
    <ul>
      <li key="D" style="color:red">D</li>
      <li key="B" style="color:yellow">B</li>
      <li key="Z" style="color:blue">Z</li>
      <li key="F" style="color:green">F</li>
    </ul>
  </div>
`;
const html2 = `
  <div id="app">
    <ul>
      <li key="E" style="color:green">E</li>
      <li key="F" style="color:red">F</li>
      <li key="D" style="color:yellow">D</li>
      <li key="Q" style="color:blue">Q</li>
      <li key="B" style="color:#252a34">B</li>
      <li key="M" style="color:#fc5185">M</li>
    </ul>
  </div>
`;
```

乱序对比的逻辑如下：

* 用新节点中的头节点的`key`在老节点进行查找
* 如果在老节点中找到`key`相同的元素，将对应的真实节点移动到`oldStartVNode.el`(老虚拟头节点对应的真实节点)之前，并且将其对应的虚拟节点设置为`null`，之后遇到`null`跳过即可，不再对其进行比对。
* 继续通过`patch`方法比对移动的节点和`newStartVNode`的标签、属性、文本以及孩子节点
* 如果在老节点中没有找到`key`相同的元素，会为新节点的头节点创建对应的真实节点，将其插入到`oldStartVNode.el`之前
* 遍历完成后，将老节点中头指针和尾指针之间多余的元素删除

画图演示下`template`中节点的比对过程：
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210116001317.png)
