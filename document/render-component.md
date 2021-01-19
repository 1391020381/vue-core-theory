## 组件渲染

`Vue`中组件分为全局组件和局部组件：

* 全局组件：通过`Vue.component(id,definition)`方法进行注册，并且可以在任何组件中被访问
* 局部组件：在组件内的`components`属性中定义，只能在局部访问

下面是一个例子：

```html

<div id="app">
  {{ name }}
  <my-button></my-button>
  <aa></aa>
</div>
```

```javascript
Vue.components('my-button', {
  template: `<button>my button</button>`
});
Vue.components('aa', {
  template: `<button>global aa</button>`
});
const vm = new Vue({
  el: '#app',
  components: {
    aa: {
      template: `<button>scoped aa</button>`
    },
    bb: {
      template: `<button>bb</button>`
    }
  },
  data () {
    return {
      name: 'ss'
    };
  }
});
```

页面中会渲染全局定义的`my-button`组件和局部定义的`aa`组件:
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210119142718.png)

接下来笔者会详细讲解组件全局组件和局部组件到底是如何渲染到页面上的，并实现相关代码。

### 全局组件

### `Vue.extend`

### 组件渲染流程

### 最后
