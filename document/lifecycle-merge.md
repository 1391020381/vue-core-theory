## 生命周期

`Vue`为用户提供了许多生命周期钩子函数，可以让用户在组件运行的不同阶段书写自己的逻辑。

那么`Vue`内部到底是如何处理生命周期函数的呢？`Vue`的生命周期究竟是在代码运行的哪个阶段执行呢？本文将实现`Vue`生命周期相关代码的核心逻辑，从源码层面来理解生命周期。

### `Vue.mixin`

在介绍生命周期之前，我们先来看下`Vue.mixin`。

`Vue.mixin`是`Vue`的全局混合器，它影响`Vue`创建的每一个实例，会将`mixin`
中传入的配置项与组件实例化时的配置项按照一定规则进行合并。对于生命周期钩子函数，相同名字的生命周期将会合并到一个数组中，混合器中的钩子函数将会先于组件中的钩子函数放入到数组中。在特定时机时，从做到右执行数组中的每一个钩子函数。

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

### 调用生命周期函数
