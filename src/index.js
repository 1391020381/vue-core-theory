import initMixin from './init';

function Vue (options) {
  this._init(options);
}

// 进行原型方法扩展
initMixin(Vue);
export default Vue;
