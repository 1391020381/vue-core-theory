let id = 0;

class Dep {
  constructor () {
    this.id = id++;
    this.subs = [];
    this.ids = new Set();
  }

  addSub (watcher) {
    // 用空间换时间：判断是否有重复watcher，只需要O(1)的时间复杂度
    if (!this.ids.has(watcher.id)) {
      this.subs.push(watcher);
      this.ids.add(watcher.id);
    }
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
