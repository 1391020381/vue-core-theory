import { popTarget, pushTarget } from './dep';

let id = 0;

class Watcher {
  constructor (vm, exprOrFn, cb, options) {
    this.id = id++;
    this.vm = vm;
    this.exprOrFn = exprOrFn;
    this.cb = cb;
    this.options = options;
    this.deps = [];
    this.depsId = new Set();
    if (typeof exprOrFn === 'function') {
      this.getter = this.exprOrFn;
    }
    this.get();
  }

  addDep (dep) {
    // 用空间换时间，使用Set来存储deps id进行去重
    if (!this.depsId.has(dep.id)) {
      this.deps.push(dep);
      this.depsId.add(dep.id);
      // 重复的dep无法进入，每个dep只能收集一次对应watcher
      dep.addSub(this);
    }
  }

  get () {
    pushTarget(this);
    this.getter();
    popTarget();
  }

  update () {
    console.log('update');
    this.get();
  }
}

export default Watcher;
