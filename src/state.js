import { del, observe, set } from './observer';
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

function createWatcher (vm, key, userDefine) {
  let handler;
  if (typeof userDefine === 'string') { // 字符串
    handler = vm[userDefine];
    userDefine = {};
  } else if (typeof userDefine === 'function') { // 函数
    handler = userDefine;
    userDefine = {};
  } else { // 对象
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
      if (Array.isArray(userDefine)) {
        userDefine.forEach(item => {
          createWatcher(vm, key, item);
        });
      } else {
        createWatcher(vm, key, userDefine);
      }
    }
  }
}

function initComputed () {

}

export function stateMixin (Vue) {
  Vue.prototype.$set = set;
  Vue.prototype.$delete = del;
  Vue.prototype.$watch = function (exprOrFn, cb, options) {
    const vm = this;
    const watcher = new Watcher(vm, exprOrFn, cb, { ...options, user: true });
    if (options.immediate) { // 在初始化后立即执行watch
      cb.call(vm, watcher.value);
    }
  };
  Vue.prototype.$nextTick = function (cb) {
    const vm = this;
    nextTick(cb);
  };
}

export default initState;
