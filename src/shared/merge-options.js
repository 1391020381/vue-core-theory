// 策略模式：为不同的合并项采用不同的合并策略

const strategies = {};

const LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed'
];

function defaultStrategy (parentVal, childVal) {
  return childVal === undefined ? parentVal : childVal;

}

function mergeHook (parentVal, childVal) {
  if (parentVal) {
    if (childVal) {
      // concat可以拼接值和数组，但是相对于push来说，会返回拼接后新数组，不会改变原数组
      return parentVal.concat(childVal);
    }
    return parentVal;
  } else {
    return [childVal];
  }
}

strategies.components = function (parentVal, childVal) {
  const result = Object.create(parentVal);
  for (const key in childVal) {
    if (childVal.hasOwnProperty(key)) {
      result[key] = childVal[key];
    }
  }
  return result;
};

LIFECYCLE_HOOKS.forEach(hook => {
  strategies[hook] = mergeHook;
});

function mergeOptions (parent, child) { // 将子选项和父选项合并
  const options = {};

  function mergeField (key) {
    const strategy = strategies[key] || defaultStrategy;
    options[key] = strategy(parent[key], child[key]);
  }

  for (const key in parent) {
    if (parent.hasOwnProperty(key)) {
      mergeField(key);
    }
  }
  for (const key in child) {
    if (child.hasOwnProperty(key) && !parent.hasOwnProperty(key)) {
      mergeField(key);
    }
  }

  return options;
}

export default mergeOptions;
