// 创建一个Set，遍历之后就会将其放入，当遇到环引用的时候不会行成死循环
import { isObject } from '../shared/utils';

const seenObjects = new Set();

export function traverse (value) {
  _traverse(value, seenObjects);
  // 遍历完成后，清空Set
  seenObjects.clear();
}

function _traverse (value, seen) {
  const isArr = Array.isArray(value);
  const ob = value.__ob__;
  // 不是对象并且没有被观测过的话，终止调用
  if (!isObject(value) || !ob) {
    return;
  }
  if (ob) {
    // 每个属性只会有一个在Observer中定义的dep
    const id = ob.dep.id;
    if (seen.has(id)) { // 遍历过的对象和数组不再遍历，防止环结构造成死循环
      return;
    }
    seen.add(id);
  }
  if (isArr) {
    value.forEach(item => {
      // 继续遍历数组中的每一项，如果为对象的话，会继续遍历数组的每一个属性，即对对象属性执行取值操作，收集watch watcher
      _traverse(item, seen);
    });
  } else {
    const keys = Object.keys(value);
    for (let i = 0; i < keys.length; i++) {
      // 继续执行_traverse，这里会对 对象 中的属性进行取值
      _traverse(value[keys[i]], seen);
    }
  }
}
