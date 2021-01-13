import initMixin from './init';
import { renderMixin } from './vdom';
import { lifecycleMixin } from './lifecycle';
import { initGlobalApi } from './global-api';
import { stateMixin } from './state';

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
