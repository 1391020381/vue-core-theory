export function renderMixin (Vue) {
  Vue.prototype._c = function () {

  };
  Vue.prototype._v = function () {

  };
  Vue.prototype._s = function () {

  };
  Vue.prototype._render = function () {
    const vm = this;
    const { render } = vm.$options;
    return render.call(vm);
  };
}
