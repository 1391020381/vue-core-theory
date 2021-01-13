## 异步更新

> * 源码地址：[传送门](https://cn.vuejs.org/v2/guide/reactivity.html#%E5%BC%82%E6%AD%A5%E6%9B%B4%E6%96%B0%E9%98%9F%E5%88%97)
> * [异步更新队列](https://cn.vuejs.org/v2/guide/reactivity.html#%E5%BC%82%E6%AD%A5%E6%9B%B4%E6%96%B0%E9%98%9F%E5%88%97)

在依赖收集章节，我们实现了在数据更新后自动更新视图。这样当用户不停的更新数据时就会不停地进行视图更新，显然这是很耗费性能的。

`Vue`在数据修改后，并没有直接更新视图，而是视图更新的方法放到异步任务中执行。本文将详细讲解具体的更新过程，并手写`Vue`的`$nextTick`方法。

### 收集去重后的`watcher`进行更新

这里先回顾一下依赖收集相关的知识：

* 页面首次挂载，会从`vm`实例上获取`data`中的值，从而调用属性的`get`方法来收集`watcher`
* 当`vm`实例上的属性更新它的值时，会执行收集到的`watcher`的`update`方法

看下之前完成的代码：

```javascript
class Watcher {
  // some code ...
  update () {
    // 直接执行更新操作
    this.get()
  }
}
```

那么`watcher`的`update`到底应该如何被执行呢？这就是本节的重点。

`watcher`的更新操作主要分为如下俩步：

* 将`watcher`去重后放到队列中
* 在异步任务中执行存放的所有`watcher`的`run`方法

代码如下：

```javascript
class Watcher {
  // some code
  update () {
    queueWatcher(this);
  }

  run () {
    this.get();
  }
}

export default Watcher;

let queue = [];
let has = {};
let pending = false;

function flushSchedulerQueue () {
  queue.forEach(watcher => {
    watcher.run();
    if (watcher.options.render) { // 在更新之后执行对应的回调: 这里是updated钩子函数
      watcher.cb();
    }
  });
  // 执行完成后清空队列
  queue = [];
  has = {};
  pending = false;
}

function queueWatcher (watcher) {
  const id = watcher.id;
  if (!has[id]) {
    queue.push(watcher);
    has[id] = true;
    if (!pending) {
      pending = true;
      setTimeout(flushSchedulerQueue)
    }
  }
}
```

此时已经实现了视图的异步更新，但是`Vue`还为用户提供而了`$nextTick`方法，让用户可以在`DOM`更新之后做些事情。即`$nextTick`中的方法会在`flushSchedulerQueue`
执行后才能执行，下面就来看下`$nextTick`和视图更新之间的逻辑。

### 实现nextTick方法

在`queueWatcher`中其实并不是直接调用`setTimeout`来进行视图更新的，而是会调用内部的`nextTick`方法。为用户提供的`$nextTick`方法，也会调用`nextTick`方法。该方法实现如下：

```javascript
let callbacks = [];
let pending = false;

function flushCallbacks () {
  callbacks.forEach(cb => cb());
  callbacks = [];
  pending = false;
}

export function nextTick (cb) {
  callbacks.push(cb);
  if (!pending) {
    pending = true;
    timerFunc();
  }
}
```

`nextTick`会接收一个回调函数，并将回调函数放到`callbacks`数组中，之后会通过`timerFunc`来异步执行`callbacks`中的每一个函数：

```javascript
let timerFunc;
if (Promise) {
  timerFunc = function () {
    return Promise.resolve().then(flushCallbacks);
  };
} else if (MutationObserver) {
  timerFunc = function () {
    const textNode = document.createTextNode('1');
    const observer = new MutationObserver(() => {
      flushCallbacks();
      observer.disconnect();
    });
    const observe = observer.observe(textNode, { characterData: true });
    textNode.textContent = '2';
  };
} else if (setImmediate) {
  timerFunc = function () {
    setImmediate(flushCallbacks);
  };
} else {
  timerFunc = function () {
    setTimeout(flushCallbacks);
  };
}
```

`timerFunc`对异步`API`进行了兼容处理，分别会先尝试使用微任务`Promise.then`、`MutationObserver`、`setImmediate`
，如果这些浏览器都不支持的话，那么会使用宏任务`setTimeout`。

在`queueWatcher`里我们将`flushSchedulerQueue`作为参数执行`nextTick`：

```javascript
function queueWatcher (watcher) {
  const id = watcher.id;
  if (!has[id]) {
    queue.push(watcher);
    has[id] = true;
    if (!pending) {
      pending = true;
      nextTick(flushSchedulerQueue);
    }
  }
}
```

在`Vue`原型上，也要增加用户可以通过实例来调用的`$nextTick`方法，其内部调用`nextTick`：

```javascript
Vue.prototype.$nextTick = function (cb) {
  nextTick(cb);
};
```

`$nextTick`会将用户传入的回调函数也放到`callbacks`中，通过异步`API`来执行。

### 测试demo详解

上面已经讲解了视图更新和`$nextTick`的实现代码，接下来写一个`demo`来实践一下。

下面实际开发中可能会用到的一段代码：

```javascript

```

在了解了`$nextTick`的具体实现后，分析下代码的执行流程：

### 写在最后

