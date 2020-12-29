// 将html解析为ast语法树
function parseHtml (html) {
  const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;
  const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
  const startTagOpen = new RegExp(`^<${qnameCapture}`);
  const startTagClose = /^\s*(\/?)>/;
  const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);

  let root, currentParent;
  // 用栈来记录当前正在处理的标签
  const stack = [];

  function createASTElement (tag, attrs) {
    return {
      tag,
      type: 1,
      attrs,
      children: [],
      parent: null
    };
  }

  // 将已经处理后的字符串进行移除
  function advance (n) {
    html = html.slice(n);
  }

  // 进行树结构管理
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

  function end (tag) {
    stack.pop();
    currentParent = stack[stack.length - 1];
  }

  function char (text) {
    text = text.replace(/\s/g, '');
    if (currentParent && text) {
      currentParent.children.push({
        type: 3,
        text,
        parent: currentParent
      });
    }
  }

  function handleStartTag () {
    const start = html.match(startTagOpen);
    if (start) {
      // 处理开始标签
      const match = {
        tag: start[1],
        attrs: []
      };
      // 处理开始标签的属性
      advance(start[0].length);
      let end, attr;
      while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
        match.attrs.push({
          name: attr[1],
          value: attr[3] || attr[4] || attr[5]
        });
        advance(attr[0].length);
      }
      if (end) { // 删除结束标签
        advance(end[0].length);
      }
      return match;
    }
  }

  function handleEndTag () {
    const match = html.match(endTag);
    advance(match[0].length);
    return match;
  }

  function startParse () {
    while (html) {
      const textEnd = html.indexOf('<');
      if (textEnd === 0) { // 匹配到了标签
        const startTagMatch = handleStartTag();
        // 开始标签
        if (startTagMatch) {
          start(startTagMatch.tag, startTagMatch.attrs);
          continue;
        }
        // 结束标签
        const endTagMatch = handleEndTag();
        if (endTagMatch) {
          end(endTagMatch[1]);
          continue;
        }
      }
      // 说明是文本标签
      if (textEnd > 0) {
        const text = html.slice(0, textEnd);
        if (text) {
          char(text);
          advance(text.length);
        }
      }
    }
  }

  startParse();
  return root;
}

module.exports = parseHtml;
