let callbacks = [];
let pending = false;
let timerFunc;

function flushCallbacks () {
  // 注意：数组的长度这里是会发生变化的，在异步队列等待的过程中，可能会继续项callbacks中添加任务
  // forEach会提前保存数组的长度，导致后来添加的内容不会被访问
  // callbacks.forEach(cb => cb());
  // 这里自己用for循环遍历，保证数组中新增的内容可以被访问当
  for (let i = 0; i < callbacks.length; i++) {
    callbacks[i]();
  }
  callbacks = [];
  pending = false;
}

if (Promise) {
  timerFunc = function () {
    return Promise.resolve().then(flushCallbacks);
  };
} else if (MutationObserver) {
  timerFunc = function () {
    const textNode = document.createTextNode('1');
    const observer = new MutationObserver(() => {
      flushCallbacks();
      observer.disconnect();
    });
    const observe = observer.observe(textNode, { characterData: true });
    textNode.textContent = '2';
  };
} else {
  timerFunc = function () {
    setTimeout(flushCallbacks);
  };
}

export function nextTick (cb) {
  callbacks.push(cb);
  if (!pending) {
    pending = true;
    timerFunc();
  }
}
