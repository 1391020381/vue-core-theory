## 数据劫持

`Vue`会对我们在`data`中传入的数据进行拦截：

* 对象：递归的为对象的每个属性都设置`get/set`方法
* 数组：修改数组的原型方法，对于会修改原数组的方法进行了重写

在用户为`data`中的对象设置、修改值以及调用修改原数组方法的时，都可以添加一些逻辑来进行处理，实现数据更新页面也同时更新。

> `Vue`中的响应式(`reactive`): 对对象属性或数组方法进行了拦截，在属性或数组更新时可以同时自动地更新视图。在代码中被观测过的数据具有响应性

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

新建`src/observer/index.js`，在这里书写`observe`函数的逻辑：

```javascript
function observe (data) {
  // 如果是对象，会遍历对象中的每一个元素
  if (typeof data === 'object' && data !== null) {
    // 已经观测过的值不再处理
    if (data.__ob__) {
      return;
    }
    new Observer(data);
  }
}

export { observe };
```

`observe`函数中会过滤`data`中的数据，只对对象和数组进行处理，真正的处理逻辑在`Observer`中：

```javascript
/**
 * 为data中的所有对象设置`set/get`方法
 */
class Observer {
  constructor (value) {
    this.value = value;
    // 为data中的每一个对象和数组都添加__ob__属性，方便直接可以通过data中的属性来直接调用Observer实例上的属性和方法
    defineProperty(this.value, '__ob__', this);
    // 这里会对数组和对象进行单独处理，因为为数组中的每一个索引都设置get/set方法性能消耗比较大
    if (Array.isArray(value)) {
      Object.setPrototypeOf(value, arrayProtoCopy);
      this.observeArray(value);
    } else {
      this.walk();
    }
  }

  walk () {
    for (const key in this.value) {
      if (this.value.hasOwnProperty(key)) {
        defineReactive(this.value, key);
      }
    }
  }

  observeArray (value) {
    for (let i = 0; i < value.length; i++) {
      observe(value[i]);
    }
  }
}
```

> **需要注意的是，`__ob__`属性要设置为不可枚举，否则之后在对象遍历时可能会引发死循环**

`Observer`类中会为对象和数组都添加`__ob__`属性，之后便可以直接通过`data`中的对象和数组`vm.obj.__ob__`来获取到`Observer`实例。

当传入的`value`为数组时，会将数组的原型指向我们继承`Array.prototype`新创建的原型。创建`data`中数组原型的逻辑在`array.js`中：

```javascript
// if (Array.isArray(value)) {
//    Object.setPrototypeOf(value, arrayProtoCopy);
//    this.observeArray();
// }
const arrayProto = Array.prototype;
export const arrayProtoCopy = Object.create(arrayProto);

const methods = ['push', 'pop', 'unshift', 'shift', 'splice', 'reverse', 'sort'];

methods.forEach(method => {
  arrayProtoCopy[method] = function (...args) {
    const result = arrayProto[method].apply(this, args);
    console.log('change array value');
    // data中的数组会调用这里定义的方法，this指向该数组
    const ob = this.__ob__;
    let inserted;
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args;
        break;
      case 'splice': // splice(index,deleteCount,item1,item2)
        inserted = args.slice(2);
        break;
    }
    if (inserted) {ob.observeArray(inserted);}
    return result;
  };
});
```

通过`Object.create`方法，可以创建一个原型为`Array.prototype`的新对象`arrayProtoCopy`。修改原数组的7个方法会设置为新对象的私有属性，并且在执行时会调用对应的`arrayProto`
上对应的方法。

在这样处理之后，便可以在`arrayProto`中的方法执行前后添加自己的逻辑，而这除了这7个方法外的其它方法，会根据原型链，使用`arrayProto`上的对应方法，并不会有任何额外的处理。

在修改原数组的方法中，添加了如下的额外逻辑：

```javascript
const ob = this.__ob__;
let inserted;
switch (method) {
  case 'push':
  case 'unshift':
    inserted = args;
    break;
  case 'splice': // splice(index,deleteCount,item1,item2)
    inserted = args.slice(2);
    break;
}
if (inserted) {ob.observeArray(inserted);}
```

`push`、`unshift`、`splice`会为数组新增元素，对于新增的元素，也要对其进行观测。这里利用到了`Observer`中为数组添加的`__ob__`属性，来直接调用`ob.observeArray`
,对数组中新增的元素继续进行观测。

对于对象，要遍历对象的每一个属性，来为其添加`set/get`方法。如果对象的属性依旧是对象，会对其进行递归处理

```javascript
function defineReactive (target, key) {
  let value = target[key];
  // 继续对value进行监听，如果value还是对象的话，会继续new Observer，执行defineProperty来为其设置get/set方法
  // 否则会在observe方法中什么都不做
  observe(value);
  Object.defineProperty(target, key, {
    get () {
      console.log('get value');
      return value;
    },
    set (newValue) {
      if (newValue !== value) {
        // 新加的元素也可能是对象，继续为新加对象的属性设置get/set方法
        observe(newValue);
        // 这样写会新将value指向一个新的值，而不会影响target[key]
        console.log('set value');
        value = newValue;
      }
    }
  });
}

class Observer {
  constructor (value) {
    // some code ...
    if (Array.isArray(value)) {

    } else {
      this.walk();
    }
  }

  walk () {
    for (const key in this.value) {
      if (this.value.hasOwnProperty(key)) {
        defineReactive(this.value, key);
      }
    }
  }

  // some code ...  
}
```

### 数据观测存在的问题

> [检测变化的注意事项](https://cn.vuejs.org/v2/guide/reactivity.html#%E6%A3%80%E6%B5%8B%E5%8F%98%E5%8C%96%E7%9A%84%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9)

我们先创建一个简单的例子：

```javascript
const mv = new Vue({
  data () {
    return {
      arr: [1, 2, 3],
      person: {
        name: 'zs',
        age: 20
      }
    }
  }
})
```

对于对象，我们只是拦截了它的取值和赋值操作，添加值和删除值并不会进行拦截：

```javascript
vm.person.school = '北大'
delete vm.person.age
```

而对于数组，根据**索引修改值**以及**修改数组长度**不会被观测到：

```javascript
vm.arr[0] = 0
vm.arr.length--
```

为了让能处理上述的情况，`Vue`为用户提供了`$set`和`$delete`方法：

* `$set`: 为响应式对象添加一个属性，确保新属性也是响应式的，因此会触发视图更新
* `$delete`: 删除对象上的一个属性。如果对象是响应式的，确保删除触发视图更新。

### 结语
