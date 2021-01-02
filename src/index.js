import initMixin from './init';
import { renderMixin } from './vdom';
import { lifecycleMixin } from './lifecycle';
import { initGlobalApi } from './global-api';
import { stateMixin } from './state';
import { compileToFunctions } from './compiler';
import { patch } from './vdom/patch';

function Vue (options) {
  this._init(options);
}

// 进行原型方法扩展
initMixin(Vue);
renderMixin(Vue);
lifecycleMixin(Vue);
initGlobalApi(Vue);
stateMixin(Vue);
export default Vue;

const vm1 = new Vue({ data: function () {return { name: 'zs' };} });
const html1 = `
  <div id="app">
    111
  </div>
`;
const render1 = compileToFunctions(html1);
const vNode1 = render1.call(vm1);
// 当oldVNode为DOM元素时，会用新节点直接替换老节点
patch(document.getElementById('app'), vNode1);
const html2 = `
  <div id="xx">
    333
  </div>
`;
const render2 = compileToFunctions(html2);
const vNode2 = render2.call(vm1);
patch(vNode1, vNode2);
