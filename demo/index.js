const parseHtml = require('./parse-html');
const generate = require('./generate');
const { _c, _v, _s } = require('./to-real-dom');

const template = `
  <div id="app">
    <div class="aa" style="color:red;border:1px solid pink;">
      hello {{ name }} zz
      <span>world</span>
    </div>
  </div>
`;
global.name = '张三';
global._c = _c;
global._v = _v;
global._s = _s;
const ast = parseHtml(template.trim());
const code = generate(ast);
const render = new Function(`return ${code}`);
const vDom = render();
console.log(JSON.stringify(vDom, null, 2));
