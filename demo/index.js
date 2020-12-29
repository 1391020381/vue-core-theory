const parseHtml = require('./parse-html');
const generate = require('./generate');
const template = `
  <div id="app">
    <div class="aa" style="color:red;border:1px solid pink;">
      hello {{ name }} zz
      <span>world</span>
    </div>
  </div>
`;
const ast = parseHtml(template.trim());
const code = generate(ast);
// 移除parent后的
// _c('div',
//  {id:"app"},
//  _c('div',
//    {class:"aa",style:{color:"red",border: "1px solid pink"}},
//    _v("hello" + _s(name) + "zz"),
//    _c('span,undefined,_v("world"))
// )
//)
// 最后将代码字符串处理为render函数
// const ast = {
//   tag: 'div',
//   type: 1,
//   attrs: [
//     {
//       name: 'id',
//       value: 'app'
//     }
//   ],
//   children: [
//     {
//       tag: 'div',
//       type: 1,
//       attrs: [
//         {
//           name: 'class',
//           value: 'aa'
//         }
//       ],
//       children: [
//         {
//           type: 3,
//           text: 'hello{{name}}'
//         },
//         {
//           tag: 'span',
//           type: 1,
//           attrs: [],
//           children: [
//             {
//               type: 3,
//               text: 'world'
//             }
//           ]
//         }
//       ]
//     }
//   ]
// };
// 将ast生成代码字符串，之后通过new Function + with处理成render函数
