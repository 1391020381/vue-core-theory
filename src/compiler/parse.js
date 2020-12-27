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

  function start (tag, attrs) {

  }

  // 注意：在template中书写模板时可能开始和结束会有空白
  html = html.trim();
  while (html) {
    // 标签会以 < 开头
    const textEnd = html.indexOf('<');
    if (textEnd === 0) {
      const startTag = parseStartTag();
      if (startTag) {
        start(startTag.tag, startTag.attrs);
      }
    }
    break;
  }
}
