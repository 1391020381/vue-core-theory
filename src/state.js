import { observe } from './observer';
import { proxy } from './shared/utils';
import Watcher from './observer/watcher';
import { nextTick } from './shared/next-tick';

function initState (vm) {
  const options = vm.$options;
  if (options.props) {
    initProps(vm);
  }
  if (options.methods) {
    initMethods(vm);
  }
  if (options.data) {
    initData(vm);
  }
  if (options.watch) {
    initWatch(vm);
  }
}

function initProps (vm) {

}

function initMethods (vm) {

}

function initData (vm) {
  let data = vm.$options.data;
  vm._data = data = typeof data === 'function' ? data.call(vm) : data;
  observe(data);
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      // 为vm代理所有data中的属性，可以直接通过vm.xxx来进行获取
      proxy(vm, key, data);
    }
  }
}

function createWatch (vm, key, userDefine) {
  let handler;
  if (typeof userDefine === 'function') {
    handler = userDefine;
    userDefine = {};
  } else {
    handler = userDefine.handler;
    delete userDefine.handler;
  }
  vm.$watch(key, handler, userDefine);
}

/**
 * watch是一个对象，遍历对象中的每一个属性，它的值是一个函数
 *
 * watch在初始化时，会直接进行取值操作，拿到旧值，并且收集属性对应的用户定义的watcher。
 * 在值被更新的时候，会执行收集的用户定义的watcher，会再次执行取值操作，这时拿到的是新值
 *
 * 执行key对应的handler，然后将新值、旧值传入，然后将旧值设置为新值，等待下一次的更新
 *
 * @param vm
 */
function initWatch (vm) {
  const { watch } = vm.$options;
  for (const key in watch) {
    if (watch.hasOwnProperty(key)) {
      const userDefine = watch[key];
      createWatch(vm, key, userDefine);
    }
  }
}

function initComputed () {

}

export function stateMixin (Vue) {
  Vue.prototype.$watch = function (exprOrFn, cb, options) {
    const vm = this;
    new Watcher(vm, exprOrFn, cb, { ...options, user: true });
  };
  Vue.prototype.$nextTick = function (cb) {
    const vm = this;
    nextTick(cb);
  };
}

export default initState;
