## 组件渲染

`Vue`中组件分为全局组件和局部组件：

* 全局组件：通过`Vue.component(id,definition)`方法进行注册，并且可以在任何组件中被访问
* 局部组件：在组件内的`components`属性中定义，只能在局部访问

下面是一个例子：

```html

<div id="app">
  {{ name }}
  <my-button></my-button>
  <aa></aa>
</div>
```

```javascript
Vue.components('my-button', {
  template: `<button>my button</button>`
});
Vue.components('aa', {
  template: `<button>global aa</button>`
});
const vm = new Vue({
  el: '#app',
  components: {
    aa: {
      template: `<button>scoped aa</button>`
    },
    bb: {
      template: `<button>bb</button>`
    }
  },
  data () {
    return {
      name: 'ss'
    };
  }
});
```

页面中会渲染全局定义的`my-button`组件和局部定义的`aa`组件:
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210119142718.png)

接下来笔者会详细讲解组件全局组件和局部组件到底是如何渲染到页面上的，并实现相关代码。

### 全局组件

`Vue.component`是定义在`Vue`构造函数上的一个函数，它接收`id`和`definition`作为参数：

* `id`： 组件的唯一标识
* `definition`: 组件的配置项

在`src/global-api/index.js`中定义`Vue.component`方法：

```javascript
export function initGlobalApi (Vue) {
  Vue.options = {};
  // 最终会合并到实例上，可以通过vm.$options._base直接使用
  Vue.options._base = Vue;
  // 定义全局组件
  Vue.options.components = {};
  initExtend(Vue);
  Vue.mixin = function (mixin) {
    this.options = mergeOptions(this.options, mixin);
  };
  // 通过Vue.components来注册全局组件
  Vue.components = function (id, definition) {
    const name = definition.name = definition.name || id;
    // 通过Vue.extend来创建Vue的子类
    definition = this.options._base.extend(definition);
    // 将Vue子类添加到Vue.options.components对象中，key为name
    this.options.components[name] = definition;
  };
}
```

`Vue.component`帮我们做了俩件事：

1. 通过`Vue.extend`利用传入的`definition`生成`Vue`子类
2. 将`Vue`子类放到全局`Vue.options.components`中

那么`Vue.extend`是如何创建出`Vue`的子类呢？下面我们来实现`Vue.extend`函数

### `Vue.extend`

`Vue.extend`利用`JavaScript`原型链实现继承，我们会将`Vue.prototype`指向`Sub.prototype.__proto__`，这样就可以在`Sub`的实例上调用`Vue`原型上定义的方法了：

```javascript
Vue.extend = function (extendOptions) {
  const Super = this;
  const Sub = function VueComponent () {
    // 会根据原型链进行查找，找到Super.prototype.init方法
    this._init();
  };
  Sub.cid = cid++;
  // Object.create将Sub.prototype的原型指向了Super.prototype
  Sub.prototype = Object.create(Super.prototype);
  // 此时prototype为一个对象，会失去原来的值
  Sub.prototype.constructor = Sub;
  Sub.options = mergeOptions(Super.options, extendOptions);
  Sub.component = Super.component;
  return Sub;
};
```

> 如果有小伙伴对`JavaScript`原型链不太了解的话，可以看我的这篇文章: [彻底理解：JavaScript原型和原型链](https://zhuanlan.zhihu.com/p/146922194)

核心的继承代码如下：

```javascript
const Super = Vue
const Sub = function VueComponent () {
  // some code ...  
};
// Object.create将Sub.prototype的原型指向了Super.prototype
Sub.prototype = Object.create(Super.prototype);
// 此时prototype为一个对象，会失去原来的值
Sub.prototype.constructor = Sub;
```

`Object.create`会创建一个新对象，使用一个已经存在的对象作为新对象的原型。这里将创建的新对象赋值给了`Sub.prototype`，相当于做了如下俩件事：

* `Sub.prototype = {}`
* `Sub.prototype.__proto__=== Super.prototype`

为`Sub.prototype`赋值后，其之前拥有的`constructor`属性便会被覆盖，这里需要再手动指定一下`Sub.prototype.constructor = Sub`

最终`Vue.extend`会将生成的子类返回，当用户实例化这个子类时，便会通过`this._init`执行子类的初始化方法创建组件

### 组件渲染流程

在用户执行`new Vue`创建组件的时候，会执行`this._init`方法。在该方法中，会将用户传入的配置项和`Vue.options`中定义的配置项进行合并，最终放到`vm.$options`中：

```javascript
function initMixin (Vue) {
  Vue.prototype._init = function (options = {}) {
    const vm = this;
    // 组件选项和Vue.options或者 Sub.options进行合并
    vm.$options = mergeOptions(vm.constructor.options, options);
    // ...  
  };
  // ...  
}
```

执行到这里时，`mergeOptoins`会将用户传入`options`中的`components`和`Vue.options.components`中通过`Vue.component`定义的组件进行合并。

在`merge-options.js`中，我们为`strategies`添加合并`components`的策略：

```javascript
strategies.components = function (parentVal, childVal) {
  const result = Object.create(parentVal); // 合并后的原型链为parentVal
  for (const key in childVal) { // childVal中的值都设置为自身私有属性，会优先获取
    if (childVal.hasOwnProperty(key)) {
      result[key] = childVal[key];
    }
  }
  return result;
};
```

`components`的合并利用了`JavaScript`的原型链，将`Vue.options.components`中的全局组件放到了合并后对象的原型上，而将`options`中`components`
属性定义的局部组件放到了自身的属性上。这样当取值时，首先会从自身属性上查找，然后再到原型链上查找，也就是优先渲染局部组件，如果没有局部组件就会去全局组件中查找。

合并完`components`之后，接下来要创建组件对应的虚拟节点：

```javascript
function createVComponent (vm, tag, props, key, children) {
  const baseCtor = vm.$options._base;
  // 在生成父虚拟节点的过程中，遇到了子组件的自定义标签。它的定义放到了父组件的components中，所有通过父组件的$options来进行获取
  // 这里包括全局组件和自定义组件，内部通过原型链进行了合并
  let Ctor = vm.$options.components[tag];
  // 全局组件：Vue子类构造函数，局部组件：对象，合并后的components中既有对象又有构造函数，这里要利用Vue.extend统一处理为构造函数
  if (typeof Ctor === 'object') {
    Ctor = baseCtor.extend(Ctor);
  }
  props.hook = { // 在渲染真实节点时会调用init钩子函数
    init (vNode) {
      const child = vNode.componentInstance = new Ctor();
      child.$mount();
    }
  };
  return vNode(`vue-component-${Ctor.id}-${tag}`, props, key, undefined, undefined, { Ctor, children });
}

function createVElement (tag, props = {}, ...children) {
  const vm = this;
  const { key } = props;
  delete props.key;
  if (isReservedTag(tag)) { // 是否为html的原生标签
    return vNode(tag, props, key, children);
  } else {
    // 创建组件虚拟节点
    return createVComponent(vm, tag, props, key, children);
  }
}
```

在创建虚拟节点时，如果`tag`不是`html`中的定义的标签，便需要创建组件对应的虚拟节点。

组件虚拟节点中做了下面几件事：

* 通过`vm.$options`拿到合并后的`components`
* 用`Vue.extend`将`components`中的对象生成`Vue`子类构造函数
* 在虚拟节点上的`props`上添加钩子函数，方便在之后调用
* 执行`vNode`函数创建组件虚拟节点，组件虚拟节点会新增`componentsOptions`属性来存放组件的一些选项

在拿到虚拟节点之后，便会通过虚拟节点来创建真实节点，如果是组件虚拟节点要单独处理：

```javascript
// 处理组件虚拟节点
function createComponent (vNode) {
  let init = vNode.props?.hook?.init;
  init?.(vNode);
  if (vNode.componentInstance) {
    return true;
  }
}

// 将虚拟节点处理为真实节点
function createElement (vNode) {
  if (typeof vNode.tag === 'string') {
    if (createComponent(vNode)) {
      return vNode.componentInstance.$el;
    }
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

### 最后
