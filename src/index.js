import initMixin from './init';
import { renderMixin } from './vdom';
import { lifecycleMixin } from './lifecycle';

function Vue (options) {
  this._init(options);
}

// 进行原型方法扩展
initMixin(Vue);
renderMixin(Vue);
lifecycleMixin(Vue);
export default Vue;
