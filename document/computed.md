## 计算属性

### 导读

> 官网对计算属性的介绍在这里：[传送门](https://cn.vuejs.org/v2/guide/computed.html#%E8%AE%A1%E7%AE%97%E5%B1%9E%E6%80%A7)

计算属性是`Vue`中很常用的一个配置项，这里我们先用一个简单的例子来讲解它的功能：

```html

<div id="app">
  {{fullName}}
</div>
<script>
  const vm = new Vue({
    data () {
      return {
        firstName: 'Foo',
        lastName: 'Bar'
      };
    },
    computed: {
      fullName () {
        return this.firstName + this.lastName;
      }
    }
  });
</script>
```

在例子中，在计算属性中定义的`fullName`函数，会最中处理为`vm.fullName`的`getter`函数。所以`vm.fullName === 'FooBar'`。

计算属性有以下特点:

* 计算属性可以简化模板中的表达式，用户书可以写更加简洁易读的`template`
* `Vue`为计算属性提供而了缓存功能，只有当它依赖的属性(例子中的`this.firstName`和`this.lastName`)发生变化时，才会重新执行属性对应的`getter`函数，否则会将之前计算好的值返回。

正是由于`computed`的缓存功能，使得用户在使用时会优先考虑它，而不是`watch`、`methods`属性。

在了解了计算属性的用法后，我们通过代码来一步步实现`computed`，并让它完成上边的例子。

### 初始化计算属性

初始化`computed`的逻辑会书写在`scr/state.js`中：

```javascript
function initState (vm) {
  const options = vm.$options;
  // some code ...
  if (options.computed) {
    initComputed(vm);
  }
}
```

在`initComputed`中，可以通过`vm.$options.computed`拿到所有定义的计算属性。对于每个计算属性，需要对其做如下处理：

* 实例化计算属性对应的`Watcher`
* 取到计算属性的`key`，通过`Object.defineProperty`为`vm`实例添加`key`属性，并设置它的`get/set`方法

```javascript
function initComputed (vm) {
  const { computed } = vm.$options;
  // 将计算属性watcher存储到vm._computedWatchers属性中，之后方法直接通过实例vm来获取
  const watchers = vm._computedWatchers = {};
  for (const key in computed) {
    if (computed.hasOwnProperty(key)) {
      const userDef = computed[key];
      // 计算属性key的值有可能是对象，在对象中会设置它的get set 方法
      const getter = typeof userDef === 'function' ? userDef : userDef.get;
      // 为每一个计算属性创建一个watcher
      watchers[key] = new Watcher(vm, getter, () => {}, { lazy: true });
      // 将计算属性的key添加到实例vm上
      defineComputed(vm, key, userDef);
    }
  }
}
```

计算属性也可以传入`set`方法，用于设置值时处理的逻辑，此时计算属性的`value`是一个对象：

```javascript
new Vue({
    // ...
    computed: {
      fullName: {
        // getter
        get: function () {
          return this.firstName + ' ' + this.lastName
        },
        // setter
        set: function (newValue) {
          var names = newValue.split(' ')
          this.firstName = names[0]
          this.lastName = names[names.length - 1]
        }
      }
    }
  }
  //...  
)
```

在`defineComputed`函数中，我们会根据计算属性的类型来确定是否为其定义`set`方法：

```javascript
const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
};

function defineComputed (target, key, userDef) {
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = createComputedGetter(key);
  } else {
    sharedPropertyDefinition.get = createComputedGetter(key);
    // 如果是对象，用户会传入set方法
    sharedPropertyDefinition.set = userDef.set;
  }
  Object.defineProperty(target, key, sharedPropertyDefinition);
}

// 创建Object.defineProperty的get函数
function createComputedGetter (key) {
  return function () {
    // 通过之前保存的_computedWatchers来取到对应的计算属性watcher
    const watcher = this._computedWatchers[key];
    if (watcher.dirty) {
      // 只有在dirty为true的时候才会重新执行计算属性
      watcher.evaluate();
      if (Dep.target) {
        watcher.depend();
      }
    }
    return watcher.value;
  };
}
```

在对计算属性取值时，首先会调用它在`vm.fullName`上定义的`get`方法，也就是上边的`createComputedGetter`执行后返回的函数。在函数内部，只有当`watcher.dirty`为`true`
时，才会执行`watcher.evaluate`。

下面我们先看下`Watcher`中关于计算属性的代码：

```javascript
import { popTarget, pushTarget } from './dep';
import { nextTick } from '../shared/next-tick';
import { traverse } from './traverse';

let id = 0;

class Watcher {
  constructor (vm, exprOrFn, cb, options = {}) {
    // some code ...
    // 设置dirty的初始值为false
    this.lazy = options.lazy;
    this.dirty = this.lazy;
    if (typeof exprOrFn === 'function') {
      this.getter = this.exprOrFn;
    }
    // some code ...
    this.value = this.lazy ? undefined : this.get();
  }

  // 执行传入的getter函数进行求值，将其赋值给this.value
  // 求值完毕后，将dirty置为false，下次将不会再重新执行求值函数
  evaluate () {
    this.value = this.get();
    this.dirty = false;
  }

  // 为watcher中的dep，再收集渲染watcher
  depend () {
    this.deps.forEach(dep => dep.depend());
  }

  get () {
    pushTarget(this);
    const value = this.getter.call(this.vm);
    if (this.deep) {
      traverse(value);
    }
    popTarget();
    return value;
  }

  update () {
    if (this.lazy) { // 依赖的值更新后，只需要将this.dirty设置为true
      // 之后获取计算属性的值时会再次执行evaluate来执行this.get()方法
      this.dirty = true;
    } else {
      queueWatcher(this);
    }
  }

  // some code ...
}
```

`watcher.evaluate`中的逻辑便是执行我们在定义计算属性时传入的回调函数(`getter`)，将其赋值给`watcher.value`，并在取值完毕后，将`watcher.dirty`置为`false`
。这样再次取值时便直接将`watcher.value`返回即可，而不用再执行回调函数重新计算。

当计算属性的依赖属性(`this.firstName`和`this.lastName`)发生变化后，我们要更新视图，让计算属性重新执行`getter`函数获取到最新值。所以代码中判断`Dep.target`(此时为渲染`watcher`)
是否存在，如果存在会为依赖属性收集对应的渲染`watcher`。这样在依赖属性更新时，便会通过渲染`watcher`来通知视图更新，获取到最新的计算属性。

### 依赖属性更新

以文章开始时的`demo`为例，首次执行时的逻辑如下图：
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210118171758.png)

用文字来描述：

* 初始化计算属性，为`vm`添加`fullName`属性，并设置其`get`方法
* 首次渲染页面，`stack`中存储了渲染`watcher`。由于页面中用到了`fullName`属性，所以在渲染时会触发`fullName`的`get`方法
* `fullName`执行`get`会通过依赖属性`firstName`和`lastName`来求值，`computed watcher`会进入`stack`中
* 此时又会触发`firstName`和`lastName`的`get`方法，收集`computed watcher`
* `fullName`求值方法执行完成，`computed watcher`出栈，`Dep.target`为渲染`watcher`
* 此时为`fullName`对应的`computed watcher`中的`dep`(也就是`firstName`和`lastName`对应的`dep`)收集渲染`watcher`
* 完成`fullName`的取值过程，此时`firstName`和`lastName`的`dep`中分别收集的`watcher`为`[computed watcher, render watcher]`

假设我们更新了依赖，会通过收集的`watcher`进行更新：

```javascript
vm.firstName = 'F'
```

在`firstName`属性更新后，会触发其对应的`set`方法，执行`dep`中收集的`computed watcher`和`render watcher`：

* `computed watcher`: 将`this.dirty`设置为`true`，`fullName`之后取值时需要重新执行用户传入的`getter`函数
* `render watcher`: 通知视图更新，获取`fullName`的最新值

到这里我们实现的`computed`属性便能正常工作了！

### 最后

文章的源代码在这里：[传送门](https://github.com/wangkaiwd/vue-core-theory/blob/computed/src/state.js#L21)

本文从一个简单的计算属性的例子开始，一步步实现了计算属性。并且针对这个例子，详细分析了页面渲染时的整个代码执行逻辑。希望小伙伴们在读完本文后，能够从源码的角度，分析自己代码中对应计算属性相关代码的执行流程，体会一下`Vue`
的`computed`属性到底帮我们做了些什么。
