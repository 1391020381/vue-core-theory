// 修改数组的原型方法
// arrayProto.__proto__ === Array.prototype
// arrayProto继承了Array.prototype上的原型方法
// Object.create: 创建一个新对象，使用一个已经存在的对象作为新创建对象的原型
const arrayProto = Object.create(Array.prototype);
