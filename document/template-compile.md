## 模板编译

> [Vue Template Explorer](https://template-explorer.vuejs.org/)

在数据劫持中，我们完成了`Vue`中`data`选项中数据的初始操作。这之后需要将`html`字符串编译为`render`函数，其核心逻辑如下：

有`render`函数的情况下会直接使用传入的`render`函数，而在没有`render`函数的情况下，需要将`template`编译为`render`函数。其具体逻辑如下：

1. 获取`template`字符串
2. 将`template`字符串解析为`ast`抽象语法树
3. 将`ast`抽象语法树生成代码字符串
4. 将字符串处理为`render`函数赋值给`vm.$options`f

### 获取`template`字符串

在进行`template`解析之前，会进行一系列的判断流程，来最终得到`template`，其处理逻辑如下：
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210105111632.png)

用到的正则：

```javascript
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
const startTagOpen = new RegExp(`^<${qnameCapture}`);
const startTagClose = /^\s*(\/?)>/;
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);
```

