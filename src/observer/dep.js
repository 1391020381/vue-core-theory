let id = 0;

class Dep {
  constructor () {
    this.id = id++;
    this.subs = [];
  }

  addSub (watcher) {
    this.subs.push(watcher);
  }

  depend () {
    Dep.target.addDep(this);
  }

  notify () {
    this.subs.forEach(sub => {
      sub.update();
    });
  }
}

const stack = [];
Dep.target = null;

export function pushTarget (watcher) {
  stack.push(watcher);
  Dep.target = watcher;
}

export function popTarget () {
  stack.pop();
  Dep.target = stack[stack.length - 1];
}

export default Dep;
