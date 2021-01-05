## 模板编译

> [Vue Template Explorer](https://template-explorer.vuejs.org/)

在数据劫持中，我们完成了`Vue`中`data`选项中数据的初始操作。这之后需要将`html`字符串编译为`render`函数，其核心逻辑如下：

有`render`函数的情况下会直接使用传入的`render`函数，而在没有`render`函数的情况下，需要将`template`编译为`render`函数。其具体逻辑如下：

1. 获取`template`字符串
2. 将`template`字符串解析为`ast`抽象语法树
3. 将`ast`抽象语法树生成代码字符串
4. 将字符串处理为`render`函数赋值给`vm.$options`

### 获取`template`字符串

在进行`template`解析之前，会进行一系列的条件处理，来最终得到`template`，其处理逻辑如下：
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210105111632.png)

在`src/init.js`中书写如下代码：

```javascript
/**
 * 将字符串处理为dom元素
 * @param el
 * @returns {Element|*}
 */
function query (el) {
  if (typeof el === 'string') {
    return document.querySelector(el);
  }
  return el;
}

function initMixin (Vue) {
  Vue.prototype._init = function (options) {
    const vm = this;
    vm.$options = options;
    initState(vm);
    const { el } = options;
    // el选项存在，会将el通过vm.$mount方法进行挂载
    // el选项如果不存在，需要手动调用vm.$mount方法来进行组件的挂载
    if (el) {
      vm.$mount(el);
    }
  };
  Vue.prototype.$mount = function (el) {
    el = query(el);
    const vm = this;
    const options = vm.$options;
    if (!options.render) { // 有render函数，优先处理render函数
      let template = options.template;
      // 没有template,使用el.outerHTML作为template
      if (!template && el) {
        template = el.outerHTML;
      }
      options.render = compileToFunctions(template);
    }
  };
}
```

当我们得到最终的`template`后，需要调用`compileToFunctions`将`template`转换为`render`函数。在`compileToFunctions`中就是模板编译的主要逻辑。

创建`src/compiler/index.js`文件，其逻辑如下：

```javascript
export function compileToFunctions (template) {
  // 将html解析为ast语法树
  const ast = parseHtml(template);
  // 通过ast语法树生成代码字符串
  const code = generate(ast);
  // 将字符串转换为函数
  return new Function(`with(this){return ${code}}`);
}
```

### 解析`html`

当拿到对应的`html`字符串后，需要通过正则来将其解析为`ast`抽象语法树。简单来说就是将`html`处理为一个树形结构，可以很好的表示每个节点的父子关系。

下面是一段`html`，以及其表示它的`ast`:

```html

<body>
<div id="app">
  hh
  <div id="aa" style="font-size: 18px;">hello {{name}} world</div>
</div>
<script>
  const vm = new Vue({
    el: '#app',
    data () {
      return {
        name: 'zs',
      };
    },
  });
</script>
</body>
```

![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210105113641.png)

```javascript
const ast = {
  tag: 'div', // 标签名
  attrs: [{ name: 'id', value: 'app' }], // 属性数组 
  type: 1, // type:1 是元素，type: 3 是文本
  parent: null, // 父节点
  children: [] // 孩子节点
}
```

`html`的解析逻辑如下：

1. 通过正则匹配开始标签的开始符号、匹配标签的属性、匹配开始标签结束符号、匹配文本、匹配结束标签
2. `while`循环`html`字符串，每次删除掉已经匹配的字符串，直到`html`为空字符串时，说明整个文本匹配完成
3. 通过栈数据结构来记录所有正在处理的标签，并且根据标签的入栈出栈顺序生成树结构

代码中通过`advance`函数来一点点删除被匹配的字符串，其逻辑比较简单，只是对字符串进行了截取：

```javascript
// 删除匹配的字符串
function advance (length) {
  html = html.slice(length);
}
```

首先处理开始标签和属性。

以`<`开头的字符串为开始标签或结束标签，通过正则匹配开始标签，可以通过分组得到标签名。之后循环匹配标签的属性，直到匹配到结尾标签。在这过程中要将匹配到的字符串通过`advance`进行删除。

```javascript
export function parseHtml (html) {
  function parseStartTag () {
    const start = html.match(startTagOpen);
    if (start) {
      const match = { tag: start[1], attrs: [] };
      // 开始解析属性，直到标签闭合
      advance(start[0].length);
      let end = html.match(startTagClose);
      let attr = html.match(attribute);
      // 循环处理属性
      while (!end && attr) {
        match.attrs.push({
          name: attr[1],
          value: attr[3] || attr[4] || attr[5]
        });
        advance(attr[0].length);
        end = html.match(startTagClose);
        attr = html.match(attribute);
      }
      if (end) {
        advance(end[0].length);
      }
      return match;
    }
  }

  // 注意：在template中书写模板时可能开始和结束会有空白
  html = html.trim();
  while (html) {
    // 开始和结束标签都会以 < 开头
    const textEnd = html.indexOf('<');
    if (textEnd === 0) {
      // 处理开始标签
      const startTag = parseStartTag();
      if (startTag) {
        start(startTag.tag, startTag.attrs);
      }
      // some code ...  
    }
    // some code...  
  }
  return root;
}
```

在获得开始标签的标签名和属性后，通过`start`函数，可以生成树根以及每一个入栈标签对应`ast`元素并确定父子关系：

```javascript
// 树 + 栈
function createASTElement (tag, attrs) {
  return {
    tag,
    type: 1,
    attrs,
    children: [],
    parent: null
  };
}

let root, currentParent;
const stack = [];

function start (tag, attrs) {
  const element = createASTElement(tag, attrs);
  if (!root) {
    root = element;
  } else {
    // 记录父子关系
    currentParent.children.push(element);
    element.parent = currentParent;
  }
  currentParent = element;
  stack.push(element);
}
```

以一段简单的`html`为例，我们画图看下其具体的出栈入栈逻辑：

```html

<div id="app">
  <h2>
    hello world
    <span> xxx </span>
  </h2>
</div>
```

![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20210105145913.png)
通过对象的引用关系，最终便能得到一个属性结构对象`root`。

解析完开始标签后，如果剩余的文本起始字符串可能为：

* 下一个开始标签
* 文本内容
* 结束标签

如果是仍然是开始标签，会重复上述逻辑。如果是文本内容，`<`字符的索引会大于0，只需要将`[0, textEnd)`之间的文本截取出来放到父节点的`children`中即可：

```javascript
export function parseHtml (html) {

  // 树 + 栈
  let root, currentParent;
  const stack = [];

  function char (text) {
    // 替换所有文本中的空格
    text = text.replace(/\s/g, '');
    if (currentParent && text) {
      // 将文本放到对应的父节点的children数组中，其type为3，标签type为1
      currentParent.children.push({
        type: 3,
        text,
        parent: currentParent
      });
    }
  }

  while (html) {
    // some code ...
    //  < 在之后的位置，说明要处理的是文本内容
    if (textEnd > 0) { // 处理文本内容
      let text = html.slice(0, textEnd);
      if (text) {
        char(text);
        advance(text.length);
      }
    }
  }
  return root;
}
```

最后来处理结束标签。匹配到结束标签时要将`stack`中最后一个元素出栈，更新`currentParent`，直到`stack`中的元素为空时，就得到了完整的`ast`抽象语法树：
```javascript

```

### 生成代码字符串
