## watch

对于`watch`的用法，在`Vue`[文档](https://vuejs.org/v2/api/#watch) 中有详细描述，它可以让我们观察`data`中属性的变化。还提供了一个回调函数，可以让用户在值变化后做一些事情。

`watch`对象中的`value`分别支持函数、数组、字符串、对象，较为常用的是函数的方式，当想要观察一个对象以及对象中的每一个属性的变化时，也会用到对象的方式。

下面是官方的一个例子，相信在看完之后就能对`watch`的几种用法有大概的了解：

```javascript
var vm = new Vue({
  data: {
    a: 1,
    b: 2,
    c: 3,
    d: 4,
    e: {
      f: {
        g: 5
      }
    }
  },
  watch: {
    a: function (val, oldVal) {
      console.log('new: %s, old: %s', val, oldVal)
    },
    // string method name
    b: 'someMethod',
    // the callback will be called whenever any of the watched object properties change regardless of their nested depth
    c: {
      handler: function (val, oldVal) { /* ... */ },
      deep: true
    },
    // the callback will be called immediately after the start of the observation
    d: {
      handler: 'someMethod',
      immediate: true
    },
    // you can pass array of callbacks, they will be called one-by-one
    e: [
      'handle1',
      function handle2 (val, oldVal) { /* ... */ },
      {
        handler: function handle3 (val, oldVal) { /* ... */ },
        /* ... */
      }
    ],
    // watch vm.e.f's value: {g: 5}
    'e.f': function (val, oldVal) { /* ... */ }
  }
})
vm.a = 2 // => new: 2, old: 1
```

### 初始化`watch`

在知道了`watch`的用法之后，我们开始实现`watch`。

在初始化状态`initState`时，会判断用户在实例化`Vue`时是否传入了`watch`选项，如果用户传入了`watch`，就会进行`watch`的初始化操作：
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210114164146.png)

```javascript
// src/state.js
function initState (vm) {
  const options = vm.$options;
  if (options.watch) {
    initWatch(vm);
  }
}
```

`initWatch`中本质上是为每一个`watch`中的属性对应的回调函数都创建了一个`watcher`：

```javascript
// src/state.js
function initWatch (vm) {
  const { watch } = vm.$options;
  for (const key in watch) {
    if (watch.hasOwnProperty(key)) {
      const userDefine = watch[key];
      if (Array.isArray(userDefine)) { // userDefine是数组，为数组中的每一项分别创建一个watcher
        userDefine.forEach(item => {
          createWatcher(vm, key, item);
        });
      } else {
        createWatcher(vm, key, userDefine);
      }
    }
  }
}
```

`createWatcher`中得到的`userDefine`可能是函数、对象或者字符串，需要分别进行处理：

```javascript
function createWatcher (vm, key, userDefine) {
  let handler;
  if (typeof userDefine === 'string') { // 字符串
    handler = vm[userDefine];
    userDefine = {};
  } else if (typeof userDefine === 'function') { // 函数
    handler = userDefine;
    userDefine = {};
  } else { // 对象
    handler = userDefine.handler;
    delete userDefine.handler;
  }
  // 用处理好的参数调用vm.$watch
  vm.$watch(key, handler, userDefine);
}
```

`createWatcher`中对参数进行统一处理，之后调用了`vm.$watch`，在`vm.$watch`中执行了`watcher`的实例化操作：

```javascript
export function stateMixin (Vue) {
  // some code ...
  Vue.prototype.$watch = function (exprOrFn, cb, options) {
    const vm = this;
    const watch = new Watcher(vm, exprOrFn, cb, { ...options, user: true });
  };
}
```

此时`new Watcher`时传入的参数如下：

* `vm`: 组件实例
* `exprOrFn`: `watch`选项对应的`key`
* `cb`: `watch`选项中`key`对应的`value`中处理逻辑的回调函数，接收`key`对应的`data`中的属性的旧值和新值作为参数
* `options`: `{user: true, immediate: true, deep: true}`, `immediate`和`deep`属性当`key`对应的`value`为对象时，用户可能会传入

在`Watcher`中会判断`options`中有没有`user`属性来区分是否是`watch`属性对应的`watcher`:

```javascript
class Watcher {
  constructor (vm, exprOrFn, cb, options = {}) {
    this.user = options.user;
    if (typeof exprOrFn === 'function') {
      this.getter = this.exprOrFn;
    }
    if (typeof exprOrFn === 'string') { // 如果exprFn传入的是字符串，会从实例vm上进行取值
      this.getter = function () {
        const keys = exprOrFn.split('.');
        // 后一次拿到前一次的返回值，然后继续进行操作
        // 在取值是，会收集当前Dep.target对应的`watcher`，这里对应的是`watch`属性对应的`watcher`
        return keys.reduce((memo, cur) => memo[cur], vm);
      };
    }
    this.value = this.get();
  }

  get () {
    pushTarget(this);
    const value = this.getter();
    popTarget();
    return value;
  }

  // some code ...  
}
```

这里有俩个重要的逻辑：

* 由于传入的`exprOrFn`是字符串，所以`this.getter`的逻辑就是从`vm`实例上找到`exprOrFn`对应值并返回
* 在`watcher`实例化时，会执行`this.get`，此时会通过`this.getter`方法进行取值。取值就会触发对应属性的`get`方法，收集当前的`watcher`作为依赖
* 将`this.get`的返回值赋值给`this.value`，此时拿到的就是旧值

当观察的属性值发生变化后，会执行其对应的`set`方法，进而执行收集的`watch`对应的`watcher`的`update`方法：

```javascript
class Watcher {

  // some code ...
  update () {
    queueWatcher(this);
  }

  run () {
    const value = this.get();
    if (this.user) {
      this.cb.call(this.vm, value, this.value);
      this.value = value;
    }
  }
}
```

和渲染`watcher`相同，`update`方法中会将对应的`watch` `watcher`去重后放到异步队列中执行，所以当用户多次修改`watch`属性观察的值时，并不会不停的触发对应`watcher`
的更新操作，而只是以它最后一次更新后的值作为最终值来执行`this.get`进行取值操作。

当我们拿到观察属性的最新值之后，执行`watcher`中传入的回调函数，传入新值和旧值。画图来梳理下这个过程：
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210114162335.png)

### `deep`、`immdediate`属性

当用户传入`immediate`属性后，会在`watch`初始化时便立即执行对应的回调函数。其具体的执行位置是在`Watcher`实例化之后：

```javascript
Vue.prototype.$watch = function (exprOrFn, cb, options) {
  const vm = this;
  const watcher = new Watcher(vm, exprOrFn, cb, { ...options, user: true });
  if (options.immediate) { // 在初始化后立即执行watch
    cb.call(vm, watcher.value);
  }
};
```

此时`watcher.value`是被观察的属性当前的值，由于此时属性还没有更新，所以老值为`undefined`。

`watch`如果观察的属性为对象，那么默认当对象内的属性更新，并不会触发对应的回调函数。此时，用户可以传入`deep`选项，来让对象内部属性更新也调用对应的回调函数：

```javascript
class Watcher {
  // some code ...
  get () {
    pushTarget(this);
    const value = this.getter();
    if (this.deep) { // 继续遍历value中的每一项，触发它的get方法，收集当前的watcher
      traverse(value);
    }
    popTarget();
    return value;
  }
}
```

当用户传入`deep`属性后，`get`方法中会执行`traverse`方法来遍历`value`中的每一个值，这样便可以继续触发`value`中属性对应的`get`方法，为其收集当前的`watcher`作为依赖。这样在`value`
内部属性更新时，也会通知其收集的`watch` `watcher`进行更新操作。

`traverse`的逻辑只是递归遍历传入参数的每一个属性，当遇到简单数据类型便停止递归：

```javascript
// traverse.js
// 创建一个Set，遍历之后就会将其放入，当遇到环引用的时候不会行成死循环
const seenObjects = new Set();

export function traverse (value) {
  _traverse(value, seenObjects);
  // 遍历完成后，清空Set
  seenObjects.clear();
}

function _traverse (value, seen) {
  const isArr = Array.isArray(value);
  const ob = value.__ob__;
  // 不是对象并且没有被观测过的话，终止调用
  if (!isObject(value) || !ob) {
    return;
  }
  if (ob) {
    // 每个属性只会有一个在Observer中定义的dep
    const id = ob.dep.id;
    if (seen.has(id)) { // 遍历过的对象和数组不再遍历，防止环结构造成死循环
      return;
    }
    seen.add(id);
  }
  if (isArr) {
    value.forEach(item => {
      // 继续遍历数组中的每一项，如果为对象的话，会继续遍历数组的每一个属性，即对对象属性执行取值操作，收集watch watcher
      _traverse(item, seen);
    });
  } else {
    const keys = Object.keys(value);
    for (let i = 0; i < keys.length; i++) {
      // 继续执行_traverse，这里会对 对象 中的属性进行取值
      _traverse(value[keys[i]], seen);
    }
  }
}
```

需要注意的是，这里利用`Set`来存储每个属性对应的`dep`的`id`。这样当出现环时，`Set`中已经存储过了其对应`dep`的`id`，便会终止递归。
