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
  <span>hello world {{name}}</span>
</div>
<script>
  new Vue({
    el: '#app',
    data () {
      return {
        name: 'zs'
      }
    }
  })
</script>
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
      props: {},
      key: undefined,
      children: undefined,
      text: 'helloworldzs'
    }
  ],
  text: undefined
}
```

在`Vue.prototype._render`函数中，通过执行文本编译后生成的`render`方法，得到了虚拟节点：

```javascript
// src/vdom/index.js
Vue.prototype._render = function () {
  const vm = this;
  // 执行选项中的render方法，指定this为Vue实例
  const { render } = vm.$options;
  return render.call(vm);
};
```

而`render`函数中用到了`_c`,`_v`,`_s`这些方法，需要在`Vue.prototype`上添加这些方法，在`render`函数内就可以通过实例调用它们：

```javascript
// 创建虚拟节点
function vNode (tag, props, key, children, text) {
  return {
    tag,
    props,
    key,
    children,
    text
  };
}

// 创建虚拟元素节点
function createVElement (tag, props = {}, ...children) {
  const { key } = props;
  delete props.key;
  return vNode(tag, props, key, children);
}

// 创建虚拟文本节点
function createTextVNode (text) {
  return vNode(undefined, undefined, undefined, undefined, text);
}

// 将实例中data里的值转换为字符串
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
  // some code ...  
}
```

最终会递归的调用这些函数来得到虚拟节点：

```javascript
const vNode = vm.createVElement('div', { id: 'app' },
  vm.createVElement('span', undefined,
    vm.createTextVNode('hello') + vm.createTextVNode('world') + vm.stringify(vm.name)
  )
)
```

![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210106161151.png)

### 将虚拟节点处理为真实节点

### 总结
