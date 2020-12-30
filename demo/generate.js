// 将ast处理为代码字符串
const defaultTagRE = /{{((?:.|\r?\n)+?)}}/g;

function genAttrs (attrs) {
  const results = [];
  attrs.forEach(attr => {
    let { name, value } = attr;
    if (name === 'style') {
      value = value.split(';').reduce((obj, cur) => {
        const [key, val] = cur.split(':');
        obj[key] = val;
        return obj;
      }, {});
    }
    results.push(`${name}:${JSON.stringify(value)}`);
  });
  return '{' + results.join(',') + '}';
}

function gen (node) {
  if (node.type === 1) {// 元素
    return genElement(node);
  } else if (node.type === 3) { // 文本
    return genText(node.text);
  }
}

function genChildren (children) {
  // 将所有的children字符串用,拼接起来
  const result = children.map(child => gen(child));
  return result.join(',');
}

// 要拿到正则分组单元中的值，要使用regexp.exec
// String.prototype.match方法，当用正则匹配时，如果正则使用g标识不会返回捕获分组，而如果不使用g标识，只有第一次完整匹配即捕获分组被返回
// 而regexp.exec进行全局匹配时，lastIndex每次会变成跟随上次匹配的下一个位置
function genText (text) {
  if (!defaultTagRE.exec(text)) { // 没有{{}}中的值，直接将字符串返回即可
    return `_v(${JSON.stringify(text)})`;
  }
  // 有{{}}中的值，要利用lastIndex和index
  // lastIndex: 开始下次匹配的索引位置
  // index: 匹配字符串在原字符串中的索引
  let match;
  let lastIndex = defaultTagRE.lastIndex = 0;
  const tokens = [];
  while (match = defaultTagRE.exec(text)) {
    const index = match.index;
    if (index > lastIndex) {
      // 说名先匹配到了没有{{}}的文字
      tokens.push(JSON.stringify(text.slice(lastIndex, index)));
    }
    tokens.push(`_s(${match[1].trim()})`);
    lastIndex = defaultTagRE.lastIndex;
  }
  // 已经匹配完了{{}}中的内容，但是字符串中还有剩余内容需要处理
  if (lastIndex <= text.length) {
    tokens.push(JSON.stringify(text.slice(lastIndex)));
  }
  // 将所有文本用 "+" 拼接返回
  return `_v(${tokens.join('+')})`;
}

function genElement (ast) {
  const children = genChildren(ast.children);
  return `_c("${ast.tag}"${ast.attrs
    ?
    `,${genAttrs(ast.attrs)}` :
    `,undefined`
  },${children})`;
}

function generate (ast) {
  return ast ? genElement(ast) : `_c('div')`;
}

module.exports = generate;
