import { observe } from './observer';
import { proxy } from './shared/utils';

function initState(vm) {
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

function initProps(vm) {

}

function initMethods(vm) {

}

function initData(vm) {
    let data = vm.$options.data;
    vm._data = data = typeof data === 'function' ? data.call(vm) : data;
    // { arr: [1, 2, { a: 1 }]}
    observe(data);
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            // 为vm代理所有data中的属性，可以直接通过vm.xxx来进行获取
            proxy(vm, key, data);
        }
    }
}

function initWatch() {

}

function initComputed() {

}

export default initState;
