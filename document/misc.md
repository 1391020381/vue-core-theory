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

这里会涉及到树的遍历，可以学习下这里的代码是如何编写的

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

利用发布订阅收集每个属性的`watcher`，在属性值发生变化后，更新视图
