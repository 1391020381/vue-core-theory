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
    if (attr.name === 'style') {
      const styleValues = attr.value.split(',');
      // 可以对对象使用JSON.stringify来进行处理
      attr.value = styleValues.reduce((obj, item) => {
        const [key, val] = item.split(':');
        obj[key] = val.trim();
        return obj;
      }, {});
    }
    str += `${attr.name}:${JSON.stringify(attr.value)}`;
    if (i !== attrs.length - 1) {
      str += ',';
    }
  }
  return `{${str}}`;
}

// lastIndex 设置为跟随最近匹配的下一个位置
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
    // 这里的先后顺序如何确定？ 通过match.index和lastIndex的大小关系
    // match.index === lastIndex时，说明此时是{{}}中的内容，前边没有字符串
    if (match.index > lastIndex) {
      tokens.push(JSON.stringify(text.slice(lastIndex, match.index)));
    }
    // 然后将括号内的元素放到数组中
    tokens.push(`_s(${match[1].trim()})`);
    lastIndex = defaultTagRE.lastIndex;
  }
  if (lastIndex < text.length) {
    tokens.push(JSON.stringify(text.slice(lastIndex)));
  }
  return `_v(${tokens.join('+')})`;
}

function gen (child) {
  if (child.type === 1) {
    // 将元素处理为代码字符串并返回
    return generate(child);
  } else if (child.type === 3) {
    return genText(child.text);
  }
}

// 将children处理为代码字符串并返回
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
  return `_c("${el.tag}", ${genAttrs(el.attrs)}${children ? ',' + children : ''})`;
}

