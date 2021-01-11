## 依赖收集

> 源码地址：[传送门](https://github.com/wangkaiwd/vue-core-theory/blob/dep-collect/src/observer/index.js)

`Vue`为用户提供了一个特别方便的功能：**数据更新时自动更新`DOM`**。本文将详细介绍`Vue`源码中该特性实现的核心思路，深入理解`Vue`数据和视图的更新关系。

### 思路梳理

> [如何追踪变化](https://cn.vuejs.org/v2/guide/reactivity.html)

这是`Vue`官方数据变化引发视图更新的图解：
![](https://vuejs.org/images/data.png)

用文字描述的话，其流程如下：

1. 组挂载，执行`render`方法生成虚拟`DOM`。此时在模板中用到的数据，会从`vm`实例上进行取值
2. 取值会触发`data`选项中定义属性的`get`方法
3. `get`方法会将渲染页面的`watcher`作为依赖收集到`dep`中
4. 当修改模板中用到的`data`中定义的属性时，会通知`dep`中收集的`watcher`执行`update`方法来更新视图
5. 重新利用最新的数据来执行`render`方法生成虚拟`DOM`。此时不会再收集重复的渲染`watcher`

> 渲染`watcher`就是用来更新视图的`watcher`，具体的执行过程在[组件初渲染](https://zhuanlan.zhihu.com/p/342356081)中有详细介绍，它的主要作用如下：
> 1. 执行`vm._render`方法生成虚拟节点
> 2. 执行`vm._update`方法将虚拟节点处理为真实节点挂载到页面中

需要注意的是，数组并没有为每个索引添加`set/get`方法，而是重写了数组的原型。所以当通过调用原型方法修改数组时，会通知`watcher`来更新视图，保证页面更新。

### Dep

收集`watcher`并且在数据更新后通知`watcher`更新`DOM`的功能主要是通过`Dep`来实现的，其代码如下：

```javascript
let id = 0;

class Dep {
  constructor () {
    // dep的唯一标识
    this.id = id++;
    this.subs = [];
  }

  addSub (watcher) {
    this.subs.push(watcher);
  }

  // 通过watcher来收集dep
  depend () {
    Dep.target.addDep(this);
  }

  // 执行所有收集watcher的update方法
  notify () {
    this.subs.forEach(sub => {
      sub.update();
    });
  }
}
```

`Dep`会将`watcher`收集到内部数组`subs`中，之后通过`notify`方法进行统一执行。

代码中还会维护一个栈，来保存所有正在执行的`watcher`，执行完毕后`watcher`出栈。

```javascript
const stack = [];
// 当前正在执行的watcher
Dep.target = null;

export function pushTarget (watcher) {
  stack.push(watcher);
  Dep.target = watcher;
}

export function popTarget () {
  stack.pop();
  Dep.target = stack[stack.length - 1];
}
```

> 目前代码并没有用到栈，在之后实现计算属性时，会利用栈中存储的渲染`watcher`来更新视图

通过上面的代码，就可以通过`dep`来实现对`watcher`的收集和通知。

### Watcher

> 本文中讲到的`watcher`只是起到渲染视图的作用，所以将其称为渲染`watcher`。在之后涉及到`watch`和`computed`之后，还会有它们各自相对应的`watcher`。

`Watcher`的主要功能：

* 收集`dep`，用于之后实现`computed`的更新
* 通过`get`方法来更新视图

```javascript
let id = 0;

class Watcher {
  constructor (vm, exprOrFn, cb, options) {
    // 唯一标识
    this.id = id++;
    this.vm = vm;
    this.exprOrFn = exprOrFn;
    this.cb = cb;
    this.options = options;
    this.deps = [];
    this.depsId = new Set(); // 利用Set来进行去重
    if (typeof exprOrFn === 'function') {
      this.getter = this.exprOrFn;
    }
    this.get();
  }

  // 在watcher中对dep进行去重，然后收集起来，并且再让收集的dep收集watcher本身(this)。这样便完成了dep和watcher的相互收集
  addDep (dep) {
    // 用空间换时间，使用Set来存储deps id进行去重
    if (!this.depsId.has(dep.id)) {
      this.deps.push(dep);
      this.depsId.add(dep.id);
      // 重复的dep无法进入，每个dep只能收集一次对应watcher
      dep.addSub(this);
    }
  }

  get () {
    // 更新视图之前将watcher入栈
    pushTarget(this);
    this.getter();
    // 视图更新后，watcher出栈
    popTarget();
  }

  // 更新视图
  update () {
    this.get();
  }
}
```

`Watcher`接收的参数如下：

* `vm`: `Vue`组件实例
* `exprOrFn`: 表达式或者函数
* `cb`: 回调函数
* `options`: 执行`watcher`的一些选项

首先，在组件初次挂载时，会实例化`Watcher`，在`Watcher`内部会执行传入的`exprOrFn`渲染页面：

```javascript
Vue.prototype.$mount = function (el) {
  // some code ...
  mountComponent(vm);
};

export function mountComponent (vm) {
  callHook(vm, 'beforeMount');

  function updateComponent () {
    vm._update(vm._render());
  }

  // 在实例化时，会执行updateComponent来更新视图
  new Watcher(vm, updateComponent, () => {}, { render: true });
  callHook(vm, 'mounted');
}
```

当`data`选项中的值发生更新后，会通过`dep.notify`来调用`watcher`的`update`，而`watcher`的`update`方法会调用`exprOrFn`即我们之前传入的`updateComponent`
方法，从而更新视图。
<p align="center">
  <img src="https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210111164529.png" height="400px"/>
</p>

### 依赖收集

依赖收集时分别对对象和数组进行了不同的操作：

取值时：

* 对象：在对象每一个属性的`get`方法中，利用属性对应的`dep`来收集当前正在执行的`watcher`
* 数组：在`Observer`中，为所有`data`中的对象和数组都添加了`__ob__`属性，可以获取`Observer`实例。并且为`Observer`实例设置了`dep`
  属性，可以直接通过`array.__ob__.depend()`来收集依赖。

设置值时：

* 对象：通过被修改属性的`set`方法，调用`dep.notify`来执行收集的`watcher`的`update`方法
* 数组：通过调用数组方法来修改数组，在对应的数组方法更新完数组后，还会执行数组对应的`array.__ob__.notify`来通知视图更新

依赖收集的具体代码如下:

为每一个`Observer`添加`dep`属性：

```javascript
class Observer {
  constructor (value) {
    this.value = value;
    this.dep = new Dep(); // data中对象和数组创建dep
    // 为data中的每一个对象和数组都添加__ob__属性，方便直接可以通过data中的属性来直接调用Observer实例上的属性和方法
    defineProperty(this.value, '__ob__', this);
    if (Array.isArray(value)) {
      Object.setPrototypeOf(value, arrayProtoCopy);
      this.observeArray(value);
    } else {
      this.walk();
    }
  }

  // some code ...
}
```

`observe`中将`Observer`实例返回，并且对已经执行过`Observer`的数据不再处理:

```javascript
function observe (data) {
  // 如果是对象，会遍历对象中的每一个元素
  if (typeof data === 'object' && data !== null) {
    // 已经观测过的数据会有__ob__属性，将不再处理，返回undefined
    if (data.__ob__) {
      return;
    }
    // 返回Observer实例
    return new Observer(data);
  }
}
```

`data`中每个对象的属性都会在`get`方法中收集依赖，在`set`方法中通知视图更新。也会为`data`中的对象和数组在`Observer`实例中创建的`dep`收集`watcher`：

```javascript
function defineReactive (target, key) {

  let value = target[key];
  // 继续对value进行监听，如果value还是对象的话，会继续new Observer，执行defineProperty来为其设置get/set方法
  // 否则会在observe方法中什么都不做
  const childOb = observe(value);
  const dep = new Dep();
  Object.defineProperty(target, key, {
    get () {
      if (Dep.target) { // 每个属性都收集watcher
        // 为对象的每一个属性收集依赖
        dep.depend();
        if (childOb) {
          // 收集数组的依赖，在数组更新的时候，会调用notify方法，通知数组更新
          // 这里是定义在Observer中的另一个新的dep
          childOb.dep.depend();
          // 对于数组中依旧有数组的情况，需要对其再进行依赖收集
          dependArray(value);
        }
      }
      return value;
    },
    set (newValue) {
      if (newValue !== value) {
        observe(newValue);
        value = newValue;
        dep.notify();
      }
    }
  });
}
```

对于数组，要递归为数组中每一项继续收集`watcher`。这样即使当数据为`arr:[[1,2,3]]`时，也可以在内层数组调用数组方法更新时通知视图更新:

```javascript
// src/observer/array.js
export function dependArray (data) {
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      // item也可能是对象，会对对象再次进行依赖收集，此时和defineReactive中收集的dep不是同一个
      item.__ob__?.dep.depend();
      dependArray(item);
    }
  }
}
```

当调用修改原数组的方法时，通过`vm.array.__ob__.dep.notify`来通知视图更新：

```javascript
// some code ...
methods.forEach(method => {
  arrayProtoCopy[method] = function (...args) {
    const result = arrayProto[method].apply(this, args);
    // data中的数组会调用这里定义的方法，this指向该数组
    const ob = this.__ob__;
    // some code ...
    ob.dep.notify();
    return result;
  };
});
```

调用如`concat`等数组方法时，并不会修改原数组，需要我们手动将原数组赋值为更改后的新数组，这样就会触发`defineReactive`中原数组对应的`set`方法，从而更新视图。

```javascript
// 会触发array属性的set方法，调用dep.notify通知视图更新
vm.array = newArray
```

在`Observer`中定义的`dep`，与`defineReactive`中的`dep`不同，是一个新的`dep`，会收集数组和对象依赖的`watcher`。在之后便可以很方便的通过`vm.data.__ob__`
来获取到`Observer`实例，进行而调用`dep`中的`depend`和`notify`方法。

### $set 和 $delete

现在数据更新，视图也会自动更新。但是删除和新增对象属性以及通过索引修改数组并不会更新视图，为了应对这些情况，我们为代码设计了`$set`和`$delete`方法。

其用法如下：

```javascript
// Vue.set( target, propertyName/index, value )
// 为对象新增属性
this.$set(this.someObject, 'b', 2)
// 通过索引来修改数组
this.$set(this.someArray, 1, 2)
// Vue.delete( target, propertyName/index)
this.$delete(this.someObject, 'a')
```

下面是其代码实现：
> 由于新增属性时，`value`是自己传入的，需要重构`defineReactive`函数。这里对于重构过程不再赘述，具体可以参考源代码。

```javascript
function set (target, key, value) {
  if (Array.isArray(target)) {// 数组直接调用splice方法
    target.splice(key, 0, value);
    return value;
  }
  if (typeof target === 'object' && target != null) { // 对象
    const ob = target.__ob__;
    // 通过Object.defineProperty为对象新加的属性,添加其对应的set/get方法，并进行依赖收集
    defineReactive(target, key, value);
    // 对象更新后通知视图更新
    ob.dep.notify();
    return value;
  }
}

function del (target, key) {
  if (Array.isArray(target)) {
    // 代用splice删除元素
    target.splice(key, 1);
    return;
  }
  if (typeof target === 'object' && target != null) { // 对象
    const ob = target.__ob__;
    delete target.key;
    // 删除对象属性后通知视图更新
    ob.dep.notify();
  }
}
```

对于数组，其实只是调用了`splice`方法进行元素的添加和删除。

如果是对象，`$set`方法会通过`defineReactive`为对象新增属性，并保证属性具有响应性，而`$delete`
会帮用户将对象中的对应属性删除。最终，`$set`和`$delete`都会利用之前在`Observer`中设置的`dep`属性通知视图更新。

在实现对应的方法后，为了方便用户使用，将其设置到`Vue`的原型上：

```javascript
// src/state.js
export function stateMixin (Vue) {
  Vue.prototype.$set = set;
  Vue.prototype.$delete = del;
}
```

```javascript
import { stateMixin } from './state';

function Vue (options) {
  this._init(options);
}

// some code ...

// 添加原型方法$set $delete
stateMixin(Vue);
export default Vue;
```

这样用户便可以从组件实例中方便的调用`$set`和`$delete`方法来保证数据的响应性

### 结语

依赖收集的核心其实就是：

* 获取数据的值时将视图更新函数放到一个数组中
* 设置数据的值时依次执行数组中的函数来更新视图

这里可以回头再看一下`Vue`官方文档中"[数据更改追踪](https://vuejs.org/v2/guide/reactivity.html#How-Changes-Are-Tracked) "的流程图，相信你会有不一样的理解！
