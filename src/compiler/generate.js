//<div id="app">
//   hh
//   <div id="aa">hello {{name}} xx{{msg}} hh <span style="color: red" class="bb">world</span></div>
// </div>
// 要将对应的ast语法树转换为代码字符串
// _c(
//  'div','{id:"app"}',
//  _v('hh'),
//  _c(
//    'div',
//    '{ id:"aa" }',
//    _v('hello' + _s(name) + xx + _s(msg) + 'hh'),
//    _c('div')
//   )
// )
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;

function genAttrs (attrs) {
  if (attrs.length === 0) {
    return 'undefined';
  }
  let str = '';
  for (let i = 0; i < attrs.length; i++) {
    const attr = attrs[i];
    str += `${attr.name}:${JSON.stringify(attr.value)}`;
    if (i !== attrs.length - 1) {
      str += ',';
    }
  }
  return `{${str}}`;
}

// note regular expression lastIndex problem: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/lastIndex
function genText (text) {
  if (!defaultTagRE.test(text)) {
    return `_v(${JSON.stringify(text)})`;
  }
  // <div id="aa">hello {{name}} xx{{msg}} hh <span style="color: red" class="bb">world</span></div>
  const tokens = [];
  let lastIndex = defaultTagRE.lastIndex = 0;
  let match;
  while (match = defaultTagRE.exec(text)) {
    // 这里的先后顺序如何确定？
    if (match[1]) {
      tokens.push(`_s(${JSON.stringify(match[1])})`);
    }
    tokens.push(text.slice(lastIndex, match.index));
    lastIndex = defaultTagRE.lastIndex;
  }
  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }
  return `_v(${tokens.join('+')})`;
}

function genChildren (children, code = '') {
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type === 1) {// 元素
      code += generate(child);
    } else if (child.type === 3) { // 文本
      code += genText(child.text);
    }
    if (i !== children.length - 1) {
      code += ',';
    }
  }
  return code;
}

export function generate (el) {
  const children = genChildren(el.children);
  return `_c("${el.tag}", ${genAttrs(el.attrs)}, ${children}) `;
}

