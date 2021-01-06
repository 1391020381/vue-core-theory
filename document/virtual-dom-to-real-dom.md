## 组件初渲染

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

`_render`函数最终会递归的调用这些函数来得到虚拟节点，并将其返回：

```javascript
const vNode = vm.createVElement('div', { id: 'app' },
  vm.createVElement('span', undefined,
    vm.createTextVNode('hello') + vm.createTextVNode('world') + vm.stringify(vm.name)
  )
)
```

![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210106161151.png)
在生成虚拟节点的过程中，会从组件实例`vm`中取值，从而触发对应属性的`get/set`方法。

### 将虚拟节点处理为真实节点

在通过`Vue.prototype._render`函数生成虚拟节点后，在`Vue.prototype._update`方法中会利用虚拟节点，替换当前页面上渲染的元素`app`。

其代码如下：

```javascript
// src/lifecycle.js
export function lifecycleMixin (Vue) {
  Vue.prototype._update = function (vNode) {
    const vm = this;
    patch(vm.$el, vNode);
  };
}
```

在`patch`方法中，会通过虚拟节点创建真实节点，并将真实节点插入页面中：

```javascript
// src/vdom/patch.js
export function patch (oldVNode, vNode) {
  // 将虚拟节点创建为真实节点，并插入到dom中
  const el = createElement(vNode);
  // 获取到老节点的父节点
  const parentNode = oldVNode.parentNode;
  // 将新节点插入到老节点之后
  parentNode.insertBefore(el, oldVNode.nextSibling);
  // 删除老节点
  parentNode.removeChild(oldVNode);
}
```

`createElement`中是用虚拟节点生成真实节点的逻辑：

* 通过`document.createElement`来创建元素节点
* 元素节点通过`updateProperties`方法来设置它的属性
* 通过`document.createTextNode`来创建文本节点

```javascript
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
```

`createElement`会返回生成的真实`DOM`元素`el`返回，并且对子元素会再次调用`createElement`来继续生成子元素，将生成的真实元素通过`appendChild`方法插入到父节点中。

执行`createElement`最后得到的`el`是将所有子节点都插入到内部的元素，但其实`el`此时还是脱离真实`DOM`存在的，最后将它插入到真实`DOM`中便完成了整个真实节点的渲染。

下面是其执行逻辑示意图：
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210106164955.png)

### 总结

到目前为止，我们已经实现了`Vue`组件初渲染的整个过程，下面用一张图来总结一下：

![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210106172803.png)

`Vue`的组件挂载`vm.$mount(el)`过程如下：

1. 将`temlate`编译为`render`函数
2. 使用`render`函数生成虚拟节点，函数中需要的变量和方法会去`vm`的自身和原型链中查找
3. 将虚拟节点创建为真实节点，并递归的插入到页面中
4. 使用真实节点替换之前老的节点

