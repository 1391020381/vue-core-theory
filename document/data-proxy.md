## 数据劫持

`Vue`会对我们在`data`中传入的数据进行拦截：

* 对象：递归的为对象的每个属性都设置`get/set`方法
* 数组：修改数组的原型方法，对于会修改原数组的方法进行了重写

在用户为`data`中的对象设置、修改值以及调用修改原数组方法的时，都可以添加一些逻辑来进行处理，实现数据更新页面也同时更新。

### 创建`Vue`实例

我们先让代码实现下面的功能：

```html

<body>
<script>
  const vm = new Vue({
    el: '#app',
    data () {
      return {
        age: 18
      };
    }
  });
  // 会触发age属性对应的set方法
  vm.age = 20;
  // 会触发age属性对应的get方法
  console.log(vm.age);
</script>
</body>
```

在`src/index.js`中，定义`Vue`的构造函数。用户用到的`Vue`就是在这里导出的`Vue`:

```javascript
import initMixin from './init';

function Vue (options) {
  this._init(options);
}

// 进行原型方法扩展
initMixin(Vue);
export default Vue;
```

在`init`中，会定义原型上的`_init`方法，并进行状态的初始化：

```javascript
import initState from './state';

function initMixin (Vue) {
  Vue.prototype._init = function (options) {
    const vm = this;
    // 将用户传入的选项放到vm.$options上，之后可以很方便的通过实例vm来访问所有实例化时传入的选项
    vm.$options = options;
    initState(vm);
  };
}

export default initMixin;
```

在`_init`方法中，所有的`options`被放到了`vm.$options`中，这不仅让之后代码中可以更方便的来获取用户传入的配置项，也可以让用户通过这个`api`来获取实例化时传入的一些自定义选选项。并且在`Vuex`
和`Vue-Router`中，实例化时传入的`router`和`store`属性便可以通过`$options`获取到。

除了设置`vm.$options`，`_init`中还执行了`initState`方法。该方法中会判断选项中传入的属性，来分别进行`props`、`methods`、`data`、`watch`、`computed`
等配置项的初始化操作，这里我们主要处理`data`选项：

```javascript
import { observe } from './observer';
import { proxy } from './shared/utils';

function initState (vm) {
  const options = vm.$options;
  if (options.props) {
    initProps(vm);
  }
  if (options.methods) {
    initMethods(vm);
  }
  if (options.data) {
    initData(vm);
  }
  if (options.computed) {
    initComputed(vm)
  }
  if (options.watch) {
    initWatch(vm)
  }
}

function initData (vm) {
  let data = vm.$options.data;
  vm._data = data = typeof data === 'function' ? data.call(vm) : data;
  // 对data中的数据进行拦截
  observe(data);
  // 将data中的属性代理到vm上
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      // 为vm代理所有data中的属性，可以直接通过vm.xxx来进行获取
      proxy(vm, key, data);
    }
  }
}

export default initState;
```

在`initData`中分别进行如下操作：

1. 将`data`统一处理为对象
2. 观测`data`中的数据，为所有对象属性添加`set/get`方法，重写数组的原型链方法
3. 将`data`中的属性代理到`vm`上，方便用户直接通过实例`vm`来访问对应的值，而不是通过`vm._data`来访问
