const LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeDestroy',
  'destroyed'
];

const strategies = {};

function mergeHook (parentVal, childVal) {
  if (parentVal) {
    if (childVal) {
      // 将子和父进行拼接，然后返回
      // concat会返回拼接后的新数组，并且concat也支持拼接非数组的单个值
      return parentVal.concat(childVal);
    }
    return parentVal;
  } else {
    return [childVal];
  }
}

LIFECYCLE_HOOKS.forEach(hook => {
  strategies[hook] = mergeHook;
});

function mergeField (parentVal, childVal, key) {
  if (strategies[key]) {
    return strategies[key](parentVal, childVal);
  } else {
    // 先默认返回子对应的选项
    return childVal;
  }
}

function mergeOptions (parent, child) {
  const options = {};
  // 处理：父中有的，父和子都有的
  for (const key in parent) {
    if (parent.hasOwnProperty(key)) {
      options[key] = mergeField(parent[key], child[key], key);
    }
  }
  // 处理：只在子中有的
  for (const key in child) {
    if (child.hasOwnProperty(key) && !parent.hasOwnProperty(key)) {
      options[key] = mergeField(parent[key], child[key], key);
    }
  }
  return options;
}

export default mergeOptions;
