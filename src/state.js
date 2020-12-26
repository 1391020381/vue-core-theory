import { observe } from './observe';

function initState (vm) {
  const options = vm.$options;
  if (options.props) {
    initProps(vm);
  }
  if (options.data) {
    initData(vm);
  }
}

function initProps (vm) {

}

function initData (vm) {
  let data = vm.$options.data;
  vm._data = data = typeof data === 'function' ? data.call(vm) : data;
  observe(data);
}

function initWatch () {

}

function initComputed () {

}

export default initState;
