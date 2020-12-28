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

function genText (text) {
  if (!defaultTagRE.test(text)) {
    return `_v(${JSON.stringify(text)})`;
  }
  // <div id="aa">hello {{name}} xx{{msg}} hh <span style="color: red" class="bb">world</span></div>
  const tokens = [];

}

function genChildren (children, code = '') {
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type === 1) {// 元素
      // code = generate(child);
    } else if (child.type === 3) { // 文本
      code += genText(child.text);
    }
  }
  return code;
}

export function generate (ast) {
  const children = genChildren(ast.children);
  let code = `_c(
    "${ast.tag}",
    ${genAttrs(ast.attrs)},
    ${children}
  ) `;
  console.log('code', code);
  return code;
}

