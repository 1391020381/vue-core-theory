## 模板编译

[`html`解析成`ast`语法树](https://vuejs.org/v2/guide/instance.html#Lifecycle-Diagram) ：

* 是否有`el`选项？没有会调用`vm.$mount(el)`，这里的`el`是自己传入的
* 是否`template`选项？
  * 有的话，将`template`编译为`render`函数
  * 没有，将`el.outerHTML`做为`template`编译为`render`函数

核心：如何将`template`转换为`render`函数

* 利用正则对字符串进行匹配，得到`ast`语法树
* `ast`语法树 -> code
* new Function + with: code -> render
* 虚拟结点 -> 真实节点

### 优化静态节点

这里会涉及到树的遍历，可以学习下这里的代码是如何编写的(如何利用栈来生成树)

### 代码生成

```javascript
<div id="app" name="xx">
  hh
  <div id="aa">hello {{ name }} xx{{ msg }} hh
    <span style="color: red" class="bb">world</span>
  </div>
  zz
</div>
```

上边代码中`hh`和`zz`会被如何解析？

### 生成真实`dom`

1. 通过`render`函数生成虚拟`dom`
2. 将虚拟`dom`转化为真实`dom`

### 依赖收集

利用发布订阅收集每个属性的`watcher`，在属性值发生变化后，更新视图。

对象

数组：

* 需要单独为数组收集依赖

### 异步更新

在执行`watcher`的更新操作时，并不是直接执行，而是先将`watcher`放入一个队列中，等到主线程所有的更新操作完成后，然后再执行更新。并且在收集的时候会进行去重，保证同一个`watcher`不会被触发多次。

### DOM diff

* 在首次渲染之后，将会保存前一次渲染的虚拟节点作为`oldVNode`，再次渲染时，将新节点和老节点传入`patch`方法中
* 进行比对，复用之前的老元素，删除新元素中没有的节点，然后创建新增的节点：
  * 比对标签，如果标签不同，直接用新节点替换老节点
  * 标签相同，对老节点的属性进行更新
  * 继续对比孩子节点
    * 处理老节点或新节点有一个没有的情况
    * 如果老节点和新节点都有，且为文本节点
    * 如果老节点和新节点都有，而且是元素，进行`DOM diff`
      * 分别设置头指针和尾指针
      * 针对常见操作进行了优化：

问题：`Vuex`中是如何通过另一个`Vue`实例，来保证数据的响应性的？其内部的逻辑到底是怎样的？

### 计算属性

* computed: { fullName(){ return this.firstName + this.lastName } }
* `initComputed`
* 遍历computed中的每一个属性，分别它的`key`在`vm`上定义`get`方法
* new Watcher(vm,functionFullName() {return this.firstName + this.lastName},() => {},{lazy:true})
* 内部定义一个标识`dirty`，来判断是否需要更新计算属性对应的值
* 首次初始化时不会执行`fullName`函数
* 在页面渲染时，如果页面中用到了`fullName`，会触发`vm.fullName`的取值`get`方法
* `dirty: true`,重新计算计算属性的值，执行`this.get()`，并且将`dirty`设置为`false`
* 由于执行了`this.get()`方法，会触发`this.firstName`和`this.lastName`的取值操作，会为其收集计算属性`watcher`
* 由于在更新依赖时要通知页面更新从而重新计算`fullName`的最新值，所以还要再为`this.firstName`和`this.lastName`再收集渲染`watcher`，此时`Dep`
  中定义的栈起到了作用，可以通过栈中的前一项来找到渲染`watcher`
* 在执行计算属性`watcher`的`update`后，要将`dirty: true`，这样会再次取值时重新计算

### 渲染子组件

问题记录：

1. 如何理解创建一个脱离文本的组件？
   ```js
   const component = new Vue.extend(options); 
   component.$mount(); 
   document.body.appendChild(vm.$el)
   ```
2. 组件是如何挂载到页面上的？
