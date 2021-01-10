## 生命周期

> 源码地址：[传送门](https://github.com/wangkaiwd/vue-core-theory/blob/lifecycle/src/global-api/index.js)

`Vue`为用户提供了许多生命周期钩子函数，可以让用户在组件运行的不同阶段书写自己的逻辑。

那么`Vue`内部到底是如何处理生命周期函数的呢？`Vue`的生命周期究竟是在代码运行的哪个阶段执行呢？本文将实现`Vue`生命周期相关代码的核心逻辑，从源码层面来理解生命周期。

### `Vue.mixin`

在介绍生命周期之前，我们先来看下`Vue.mixin`。

`Vue.mixin`是`Vue`的全局混合器，它影响`Vue`创建的每一个实例，会将`mixin`
中传入的配置项与组件实例化时的配置项按照一定规则进行合并。对于生命周期钩子函数，相同名字的生命周期将会合并到一个数组中，混合器中的钩子函数将会先于组件中的钩子函数放入到数组中。在特定时机时，从左到右执行数组中的每一个钩子函数。

```html

<div id="app">
</div>
<script>
  // 生命周期：
  Vue.mixin({
    created () {
      console.log('global created');
    }
  });
  const vm = new Vue({
    el: '#app',
    data () {
    },
    created () {
      console.log('component created');
    }
  });
  // global created
  // component created  
</script>
```

上述代码会先执行`Vue.mixin`中的`created`函数，然后再执行组件中的`created`函数。下面我们看下`Vue.mixin`是怎么实现。

```javascript
// src/global-api/index.js
import mergeOptions from '../shared/merge-options';

export function initGlobalApi (Vue) {
  Vue.options = {};
  Vue.mixin = function (mixin) {
    this.options = mergeOptions(this.options, mixin);
  };
}

// src/index.js
function Vue (options) {
  this._init(options);
}

// 初始化全局api
initGlobalApi(Vue);
export default Vue;
```

在`scr/index.js`中执行`initGlobalApi`方法，会为`Vue`添加`options`和`Vue.mixin`属性。

`Vue.mixin`会将调用该函数时传入的配置项与`Vue.options`中的选项进行合并：

```javascript
Vue.options = {};
Vue.mixin = function (mixin) {
  // Vue.options = mergeOptions(Vue.options, mixin)
  this.options = mergeOptions(this.options, mixin);
};
```

`Vue.options`中会保存所有全局的配置项，如`components,directives`等。执行`Vue.mixin`之后，`Vue.options`会和`Vue.mixin`
中的选项进行合并，之后会在组件初始化时将其和组件实例化时传入的选项根据不同的合并策略进行合并，这样会根据最终合并后的全局选项和组件选项来创建`Vue`
实例：

```javascript
// src/init.js
function initMixin (Vue) {
  Vue.prototype._init = function (options) {
    const vm = this;
    // 在初始化根组件时: vm.constructor.options -> Vue.options
    // 在初始化子组件时： vm.constructor.options -> Sub.options
    // 将局部选项和全局选项进行合并
    vm.$options = mergeOptions(vm.constructor.options, options);
    // some code ...  
  };
  // some code ...  
}
```

现在关键逻辑来到了`mergeOptions`，下面来介绍`mergeOptions`的整体编写思路以及生命周期的合并过程。

### 生命周期选项合并

`mergeOptions`函数完成了组件中选项合并的逻辑:

```javascript
const strategies = {};

function defaultStrategy (parentVal, childVal) {
  return childVal === undefined ? parentVal : childVal;
}

const LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed'
];

function mergeHook (parentVal, childVal) {
  if (parentVal) {
    if (childVal) {
      // concat可以拼接值和数组，但是相对于push来说，会返回拼接后新数组，不会改变原数组
      return parentVal.concat(childVal);
    }
    return parentVal;
  } else {
    return [childVal];
  }
}

LIFECYCLE_HOOKS.forEach(hook => {
  strategies[hook] = mergeHook;
});

function mergeOptions (parent, child) { // 将子选项和父选项合并
  const options = {};

  function mergeField (key) {
    const strategy = strategies[key] || defaultStrategy;
    options[key] = strategy(parent[key], child[key]);
  }

  for (const key in parent) {
    if (parent.hasOwnProperty(key)) {
      mergeField(key);
    }
  }
  for (const key in child) {
    if (child.hasOwnProperty(key) && !parent.hasOwnProperty(key)) {
      mergeField(key);
    }
  }

  return options;
}

export default mergeOptions;
```

对于不同的选项，`Vue`会采取不同的合并策略。也就是为`strategies`添加`Vue`的各个选项作为`key`，其对应的合并逻辑是一个函数，为`strategies[key]`的值。如果没有对应`key`
的话，会采用默认的合并策略`defaultStrategy`来处理默认的合并逻辑。

这样可以让我们不用再用`if else`来不停为每一个选项进行判断，使代码更加简洁。并且在之后如果需要添加新的合并策略时，只需要添加类似如下代码即可，更易于维护:

```javascript
function mergeXXX (parentVal, childVal) {
  return result
}

strategies[xxx] = mergeXXX
```

对于生命周期，我们会将每个钩子函数都通过`mergeHook`合并为一个数组：

```javascript
function mergeHook (parentVal, childVal) {
  if (parentVal) {
    if (childVal) {
      // concat可以拼接值和数组，但是相对于push来说，会返回拼接后新数组，不会改变原数组
      return parentVal.concat(childVal);
    }
    return parentVal;
  } else {
    return [childVal];
  }
}
```

在`Vue.mixin`中提到例子的合并结果如下：
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210110180950.png)

现在我们已经成功将生命周期处理成了数组，接下来便到了执行数组中的所有钩子函数的逻辑了。

### 调用生命周期函数

完成上述代码后，我们已经成功将所有合并后的生命周期放到了`vm.$options`中对应的生命周期数组中：

```javascript
vm.$options = {
  created: [f1, f2, f3],
  mounted: [f4, f5, f6]
  // ...
}
```

想要执行某个生命周期函数，可以用它的名字从`vm.$options`找到其对应的函数执行。为了方便生命周期的调用，封装了一个`callHook`函数来帮我们做这些操作：

```javascript
// src/lifecycle.js
export function callHook (vm, hook) {
  const handlers = vm.$options[hook];
  if (handlers) {
    handlers.forEach(handler => handler.call(vm));
  }
}
```

对于目前我们已经完成的代码，可以在如下位置添加生命周期钩子函数的调用：
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210110214909.png)
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210110214756.png)

此时，用户在使用时传入的`beforeCreate,created,beforeMount,Mounted`钩子函数就可以正确执行了。

* `beforeCreate`：在组件初始化状态`initState`之前执行，此时不能访问`props,methods,data,computed`等实例上的属性
* `created`：组件初始化状态后执行，此时`props,methods,data`等选项已经初始化完毕，可以通过实例来直接访问
* `beforeMount`: 组件过载之前执行
* `mounted`: 组件挂载之后执行，即使用实例上最新的`data`生成虚拟`DOM`,然后将虚拟`DOM`挂载到真实`DOM`之后执行。

### 结语

生命周期函数本质上就是我们在配置项中传入回调函数，`Vue`会将我们传入的配置项收集到数组中，然后在特定时机统一执行。

`Vue`的生命周期从定义到执行一共经历了如下几个步骤：

1. 在组件实例化时作为选项传入
2. 首先将`Vue.mixin`中传入的配置项和`Vue.options`中的生命周期函数合并为一个数组
3. 将组件实例化时传入的选项和`Vue.options`中的生命周期继续进行合并
4. 封装`callHook`函数，从`vm.$options`中找到指定生命周期函数对应的数组
5. 在特定时机执行特定的生命周期函数

希望在阅读完本文后，能够帮小伙伴们明白，在使用`Vue`时定义的生命周期函数到底是如何被处理和执行的。
