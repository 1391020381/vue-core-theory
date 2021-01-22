## 简易版`Vue`源码实现

为了理解`Vue`的底层到底帮我们做了什么，这里笔者参考`Vue`的源码，删除源码中的一些边界情况处理，专注于核心逻辑，对一些工作中常用以及面试中常考的`Vue`的核心功能进行一一实现。

![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/Vue%20Source%20Code.jpg)

`Vue`执行流程：
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210113110645.png)

实现了以下功能，并为其创建了对应的实现教程：

* [数据劫持](https://github.com/wangkaiwd/vue-core-theory/blob/master/document/01.data-proxy.md)
* [文本编译](https://github.com/wangkaiwd/vue-core-theory/blob/master/document/02.template-compile.md)
* [组件初渲染](https://github.com/wangkaiwd/vue-core-theory/blob/master/document/03.initial-render.md)
* [生命周期合并](https://github.com/wangkaiwd/vue-core-theory/blob/master/document/04.lifecycle-merge.md)
* [依赖收集](https://github.com/wangkaiwd/vue-core-theory/blob/master/document/05.collect-dependency.md)
* [异步更新和`$nextTick`](https://github.com/wangkaiwd/vue-core-theory/blob/master/document/06.async-update.md)
* [`watch`](https://github.com/wangkaiwd/vue-core-theory/blob/master/document/07.watch.md)
* [`diff`算法](https://github.com/wangkaiwd/vue-core-theory/blob/master/document/08.dom-diff.md)
* [`computed`](https://github.com/wangkaiwd/vue-core-theory/blob/master/document/09.computed.md)
* [组件渲染](https://github.com/wangkaiwd/vue-core-theory/blob/master/document/10.render-component.md)

### 快速开始

运行项目：

```shell
npm install
npm run dev
```

需要使用工具来搭建一个本地的静态资源服务器，托管项目打包文件和`html`文件，之后直接访问`html`即可

1. `WebStorm`:  
   笔者这里使用的是`WebStorm`，它会直接通过服务器托管的方式打开`html`，将`rollup`打包后的文件直接引入即可，具体操作如下
   ![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210103160237.png)
2. 使用开源的工具，这里以[`serve`](https://github.com/vercel/serve)为例:  
   项目根目录执行`serve`，然后访问`http://localhost:5000/usage` (具体访问路径要根据实际情况)

### 目录和分支

目录设计如下：
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210103161708.png)

为了方便对每一个小功能的理解，笔者分别将每一个实现的功能分别放到对应的分支：
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210103161936.png)

这样方便了自己之后对于知识的回顾以及其它小伙伴查看每个功能的实现。

### rollup 配置

项目中的`rollup`配置在`rollup.config.js`中，并且在命令行中配置了对应的`script`。

`rollup`打包配置：

```javascript
import { nodeResolve } from '@rollup/plugin-node-resolve'; // 一个rollup插件，对在node_modules中使用的第三方模块，使用node解析算法来定位模块
export default {
  input: 'src/index.js', // 入口文件
  output: {
    name: 'Vue', // 对于iiff/umd打包生成的文件导出的值是必要的，表示你的打包文件的全局变量名
    file: 'dist/vue.js', // 打包后的文件名
    format: 'umd', // 指定生成文件的格式， umd: universal module definite, work as adm,cjs and iife all in one
    sourcemap: true, // 如果设置为true,一个单独的源码映射文件将会被创建
  },
  plugins: [
    nodeResolve(),
  ]
};
```

配置对应的打包命令：

```json
{
  "scripts": {
    "dev": "rollup -c -w"
  }
}
```

在源代码更新后，`rollup`就会帮我们更新打包文件，而不用每次都重新打包。
