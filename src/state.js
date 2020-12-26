import { observe } from './observer';

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
}

function initProps (vm) {

}

function initMethods (vm) {

}

// 为vm代理所有data中的属性，可以直接通过vm.xxx来进行获取
function proxy (target, key, source) {
  Object.defineProperty(target, key, {
    get () {
      return source[key];
    },
    set (value) {
      source[key] = value;
    }
  });
}

function initData (vm) {
  let data = vm.$options.data;
  vm._data = data = typeof data === 'function' ? data.call(vm) : data;
  observe(data);
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      proxy(vm, key, data);
    }
  }
}

function initWatch () {

}

function initComputed () {

}

export default initState;
