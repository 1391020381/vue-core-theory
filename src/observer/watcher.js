import { popTarget, pushTarget } from './dep';

let id = 0;

class Watcher {
  constructor (vm, exprOrFn, cb, options) {
    this.id = id++;
    this.vm = vm;
    this.exprOrFn = exprOrFn;
    this.cb = cb;
    this.options = options;
    if (typeof exprOrFn === 'function') {
      this.getter = exprOrFn;
    }
    this.get();
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
