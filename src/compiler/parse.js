const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
const startTagOpen = new RegExp(`^<${qnameCapture}`);
const startTagClose = /^\s*(\/?)>/;
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);

// 要解析的模板：
// convert to object
// const ast = {
//   tag: 'div', attrs: [{ name: 'id', value: 'app' }], parent: null,
//   children: [
//     {
//       tag: 'div', attrs: [{ name: 'id', value: 'aa' }], parent: 'div',
//       children: [
//         { tag: null, attrs: [], text: 'hello {{name}}', parent: 'div', children: [] },
//         {
//           tag: 'span', attrs: [{ name: 'class', value: 'bb' }], parent: 'div',
//           children: [
//             { tag: null, attrs: [], text: 'world', parent: 'span' }
//           ]
//         }
//       ]
//     }
//   ]
// };

// 每解析一点，就将template中被解析的内容删除掉

// <div id="app">
//   <div id="aa">hello {{name}} <span class="bb">world</span></div>
// </div>
// 解析步骤：
//  核心逻辑：不停的对html进行截取，直到html为空字符串
//  1. 处理开始标签
//  2. 开始标签里再递归的处理属性，一点点删除html，直到遇到结束标签，此时完成了当前标签的属性处理
//  3. 用栈来存储所有的正在处理的ast元素：处于开始，但是还没有结束的状态的ast元素。即每次在匹配开始标签时为其赋值为当前的currentParent,并且将它放到栈中
//  4. 如果匹配的结束标签，将栈中最后一个元素出栈，此时出栈的元素的父元素为栈中最后一个元素，更新currentParent为栈中最后一个元素，并记录其父子关系
export function parseHtml (html) {
  function advance (length) {
    html = html.slice(length);
  }

  function createASTElement (tag, attrs) {
    return {
      tag,
      type: 1,
      attrs,
      children: [],
      parent: null
    };
  }

  function parseStartTag () {
    const start = html.match(startTagOpen);
    if (start) {
      const match = { tag: start[1], attrs: [] };
      // 开始解析属性，直到标签闭合
      advance(start[0].length);
      let end = html.match(startTagClose);
      let attr = html.match(attribute);
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

  // 树 + 栈
  let root, currentParent;
  const stack = [];

  function start (tag, attrs) {
    const element = createASTElement(tag, attrs);
    if (!root) {
      root = element;
    }
    currentParent = element;
    stack.push(element);
  }

  // 每次处理好前一个，最后将所有元素作为子元素push到root节点中
  function end (tag) { // 在结尾标签匹配时可以确立父子关系
    // 当匹配到结尾标签时，栈中保存的最后一个元素要出栈
    const element = stack.pop();
    // 当匹配到结束标签时，它和栈中的最后一个元素的标签不一样，说明标签书写格式有问题

    // 当栈中的元素为空时，说明处理完了所有元素
    if (stack.length === 0) {return;}
    currentParent = stack[stack.length - 1];
    currentParent.children.push(element);
    element.parent = currentParent;
  }

  function char (text) {
    // 替换所有文本中的空格
    text = text.replace(/\s/g, '');
    if (currentParent && text) {
      currentParent.children.push({
        type: 3,
        text,
        parent: currentParent
      });
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
      // 处理结尾标签
      const endTagMatch = html.match(endTag);
      if (endTagMatch) {
        end(endTagMatch[1]);
        advance(endTagMatch[0].length);
      }
    }
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
