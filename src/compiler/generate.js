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

function gen (child) {
  if (child.type === 1) {
    return generate(child);
  } else if (child.type === 3) {
    return genText(child.text);
  }
}

function genChildren (children) { // 将children用','拼接起来
  const result = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    // 将生成结果放到数组中
    result.push(gen(child));
  }
  return result.join(',');
}

export function generate (el) {
  const children = genChildren(el.children);
  return `_c("${el.tag}", ${genAttrs(el.attrs)}${children ? ',' + children : ''}) `;
}

