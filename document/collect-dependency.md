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


### Dep

### Watcher

> 本文中讲到的`watcher`只是起到渲染视图的作用，所以将其称为渲染`watcher`。在之后涉及到`watch`和`computed`之后，还会有它们各自相对应的`watcher`。
