import { isReservedTag } from '../shared/utils';

function vNode (tag, props, key, children, text, componentOptions) {
  return {
    tag,
    props,
    key,
    children,
    text,
    componentOptions, // 组件虚拟节点添加了componentOptions属性来保存
  };
}

function createVComponent (vm, tag, props, key, children) {
  // components属性会最终合并到实例上
  const BaseCtor = vm.$options._base;
  // 这里要从vm.$options.components中获取定义的子组件
  // 解析ast语法树以后，对应的组件的标签以及属性和孩子都会解析好
  // 将ast转换为code时，也不会有变化，通过_c('my-button')来生成组件对应的虚拟节点
  // 而在_c对应的createVComponent函数中，会将判断标签是否为自定义标签。如果是自定义标签，说明是组件，需要生成组件虚拟节点
  // vm.$options.components：首先其拥有当前正在解析虚拟组件节点的definition以及全局Vue.component定义的组件，通过了mergeOptions对其合并
  // 在new Parent()的过程中，会在解析html
  // 拿到组件的定义：可能是对象，也可能是VueComponent构造函数
  let Ctor = vm.$options.components[tag];
  // 组件components选项中定义的组件是对象，需要通过Vue.extend来创建出Vue的子类，之后new Sub()，执行实例的_init方法来渲染组件
  if (typeof Ctor === 'object') {
    Ctor = BaseCtor.extend(Ctor);
  }

  props.hook = {
    init (vNode) {
      // 组件的各种配置项，通过definition在Vue.extend(definition)中传递好了，Sub.options = mergeOptions(Super.options,extendOptions)
      // 会合并到Sub.options中，所以Sub.options中拥有全局Vue.options和Vue.extend(definition)中传入的组件的定义的合并项
      // 最后在new Ctor后，会执行this._init(), 在这里又会将子组件实例subVm.$options = mergeOptions(Sub.options,{})进行合并
      // 所以subVm.$options中最终是Super.options, extendOptions, options三者合并的结果。而这里我们并没有为options中传入内容，都提前在Vue.extend(definition)中传递好了
      const child = vNode.componentInstance = new Ctor();
      // 逻辑： template -> ast -> code -> render
      // 在执行render生成虚拟节点时，会遇到子组件对应的标签(id),此时要单独处理子组件的虚拟节点
      // 生成子组件虚拟节点时，先会new Sub(),执行vm._init()。但是由于el没有传入，并没有进行组件挂载
      // 手动执行$mount挂载子组件
      // $mount参数为null
      // vm._update(vm._render), vm._update中执行patch中传入的oldVNode是null，此时将vm.$el返回。
      // 子组件mount完成，父组件将子组件appendChild到组件中，子组件便出现在了页面上。
      child.$mount();
    }
  };
  return vNode(`vue-component-${Ctor.cid}-${tag}`, props, key, undefined, undefined, { Ctor, children });
}

function createVElement (tag, props = {}, ...children) {
  const vm = this;
  const { key } = props;
  delete props.key;
  if (isReservedTag(tag)) {
    return vNode(tag, props, key, children);
  } else {
    return createVComponent(vm, tag, props, key, children);
  }
}

function createTextVNode (text) {
  return vNode(undefined, undefined, undefined, undefined, text);
}

function stringify (value) {
  if (value == null) {
    return '';
  } else if (typeof value === 'object') {
    return JSON.stringify(value);
  } else {
    return value;
  }
}

export function renderMixin (Vue) {
  Vue.prototype._c = createVElement;
  Vue.prototype._v = createTextVNode;
  Vue.prototype._s = stringify;
  Vue.prototype._render = function () {
    const vm = this;
    // 执行选项中的render方法，指定this为Vue实例
    const { render } = vm.$options;
    return render.call(vm);
  };
}
