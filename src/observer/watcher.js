import { popTarget, pushTarget } from './dep';
import { nextTick } from '../shared/next-tick';

let id = 0;

class Watcher {
  constructor (vm, exprOrFn, cb, options = {}) {
    this.id = id++;
    this.vm = vm;
    this.exprOrFn = exprOrFn;
    this.cb = cb;
    this.options = options;
    this.user = options.user;
    this.lazy = options.lazy;
    this.dirty = this.lazy;
    this.deps = [];
    this.depsId = new Set();
    if (typeof exprOrFn === 'function') {
      this.getter = this.exprOrFn;
    }
    if (typeof exprOrFn === 'string') {
      this.getter = function () {
        const keys = exprOrFn.split('.');
        // 后一次拿到前一次的返回值，然后继续进行操作
        return keys.reduce((memo, cur) => memo[cur], vm);
      };
    }
    this.value = this.lazy ? undefined : this.get();
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

  evaluate () {
    this.value = this.get();
    this.dirty = false;
  }

  // 为watcher中的dep，在收集渲染watcher
  depend () {
    this.deps.forEach(dep => dep.depend());
  }

  get () {
    pushTarget(this);
    const value = this.getter.call(this.vm);
    popTarget();
    return value;
  }

  update () {
    queueWatcher(this);
  }

  run () {
    const value = this.get();
    if (this.user) {
      this.cb.call(this.vm, value, this.value);
      this.value = value;
    }
    if (this.lazy) {
      this.dirty = true;
    }
  }
}

export default Watcher;

// $nextTick
let queue = [];
let has = {};
let pending = false;
// 更新操作：
//  1. 更新data中的值
//  2. 触发属性的set方法，或者数组的方法
//  3. 会调用dep.notify让收集的watcher执行update方法
//  4. 将刷新队列的操作放入异步队列中，等待主线程的代码执行完毕
function flushSchedulerQueue () {
  queue.forEach(watcher => {
    watcher.run();
    if (watcher.options.render) { // 在更新之后执行对应的回调
      watcher.cb();
    }
  });
  // 执行完成后清空队列
  queue = [];
  has = {};
  pending = false;
}

function queueWatcher (watcher) {
  const id = watcher.id;
  if (!has[id]) {
    queue.push(watcher);
    has[id] = true;
    if (!pending) {
      pending = true;
      nextTick(flushSchedulerQueue);
    }
  }
}
