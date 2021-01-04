import { observe } from './observer';
import { noop, proxy } from './shared/utils';
import Watcher from './observer/watcher';
import { nextTick } from './shared/next-tick';
import Dep from './observer/dep';

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
  if (options.computed) {
    initComputed(vm);
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
      createWatcher(vm, key, userDefine);
    }
  }
}

const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
};

// 利用高阶函数来传入额外的参数，并将想要的函数返回
// 这里要用到每个计算属性watcher，其实可以将它作为参数传过来
function createComputedGetter (key) {
  return function () {
    const watcher = this._computedWatchers[key];
    if (watcher.dirty) {
      // 执行key对应的函数，获得值赋值给watcher.value。并且在取值时会为依赖的值收集计算属性watcher
      watcher.evaluate();
      if (Dep.target) {
        // 计算属性会收集它依赖的dep,让dep再收集渲染watcher，用于页面更新
        watcher.depend();
      }
    }
    return watcher.value;
  };
}

function defineComputed (target, key, userDef) {
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = createComputedGetter(key);
  } else {
    sharedPropertyDefinition.get = createComputedGetter(key);
    sharedPropertyDefinition.set = userDef.set;
  }
  Object.defineProperty(target, key, sharedPropertyDefinition);
}

function initComputed (vm) {
  const { computed } = vm.$options;
  const watchers = vm._computedWatchers = {};
  for (const key in computed) {
    if (computed.hasOwnProperty(key)) {
      // 这里用户可能传入一个对象来配置set/get方法
      const userDef = computed[key];
      const getter = typeof userDef === 'function' ? userDef : userDef.get;
      // 这样之后可以通过vm._computedWatchers来直接访问每个计算属性对应的watcher
      watchers[key] = new Watcher(vm, getter, () => {}, { lazy: true });
      defineComputed(vm, key, userDef);
    }
  }
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
