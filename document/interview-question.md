## 面试题整理

* `Vue`是一个`MVVM`框架？
  * 尽管不是严格的与`MVVM`模式联系在一起，`Vue`的设计部分的受到了它的启发
  * MVVM: 数据变化视图会更新，视图变化数据会被影响。
  * MVVM不能跳过数据去更新视图，而`Vue`提供了`$ref`可以让我们直接操作`dom`而直接更改视图
* `Vue`的`data`选项为什么要通过函数来返回对象？
* `Vue`的渲染流程？
  * 初始化数据，为数据中的每一个属性都设置`set/get`方法
  * 结合`el`选项进行文本编译
  * 将`template`处理为`render`函数
  * 通过`render`函数生成虚拟节点
  * 通过虚拟节点生成真实节点
  * 将真实节点渲染到页面中
* `Vue`中如对下面代码执行的理解
  ```javascript
  export default{
    mounted() {
    this.a = 1
    this.a = 2
    this.a = 3
    }
  }
  ```
  ```javascript
  export default {
    data() {
      return {
        a: 1
      } 
    },
    watch: {
      a(newValue,oldValue) {
        console.log(newValue,oldValue)
      }
    },
    mounted() {
      this.a = 2
      console.log(1)
      this.$nextTick(() => {
        this.a = 3
        console.log(4)
      })
    }
  }
  ```
* 计算属性和侦听器(`watch`和`computed`之间的区别)？

