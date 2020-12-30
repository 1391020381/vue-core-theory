let id = 0;

class Dep {
  constructor () {
    this.subs = [];
  }

  addSub (watcher) {
    this.subs.push(watcher);
  }

  depend () {

  }

  notify () {
    this.subs.forEach(sub => {
      sub.update();
    });
  }
}

const stack = [];

export function pushTarget (watcher) {
  stack.push(watcher);
  Dep.target = watcher;
}

export function popTarget () {
  stack.pop();
  Dep.target = stack[stack.length - 1];
}

export default Dep;
