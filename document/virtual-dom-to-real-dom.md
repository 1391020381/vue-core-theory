## 组件的初渲染

在`Vue`进行文本编译之后，会得到代码字符串生成的`render`函数。本文会基于`render`函数介绍以下内容：

* 执行`render`函数生成虚拟节点
* 通过`vm._update`方法，将虚拟节点渲染为真实`DOM`

在`vm.$mount`方法中，文本编译完成后，要进行组件的挂载，代码如下：

```javascript
Vue.prototype.$mount = function (el) {
  // text compile code ....
  mountComponent(vm);
};

// src/lifecycle.js
export function mountComponent (vm) {
  vm._update(vm._render());
}
```

接下来看看`vm._render()`和`vm._update()`中到底做了什么

### 生成虚拟节点

原生`DOM`节点拥有大量的属性和方法，操作`DOM`比较耗费性能。在`Vue`中通过一个对象来描述`DOM`中的节点，这个对象就是虚拟节点，`Vue`组件树构建的整个虚拟节点树就是虚拟`DOM`。

这是一段`html`

```html

<div id="app">
  <span>hello world</span>
</div>
```

其对应的虚拟节点如下：

```javascript
const vNode = {
  tag: 'div',
  props: { id: 'app' },
  key: undefined,
  children: [
    {
      tag: 'span',
      props: undefined,
      key: undefined,
      children: undefined,
      text: 'hello world'
    }
  ],
  text: undefined
}
```

### 将虚拟节点处理为真实节点

### 总结

