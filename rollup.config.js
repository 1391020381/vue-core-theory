import { nodeResolve } from '@rollup/plugin-node-resolve'; // 一个rollup插件，对在node_modules中使用的第三方模块，使用node解析算法来定位模块

export default {
  input: 'src/index.js', // 入口文件
  output: {
    name: 'Vue', // 对于iiff/umd打包生成的文件导出的值是必要的，表示你的打包文件的全局变量名
    file: 'dist/vue.js', // 打包后的文件名
    format: 'umd', // 指定生成文件的格式， umd: universal module definite, work as adm,cjs and iife all in one
    sourcemap: true, // 如果设置为true,一个单独的源码映射文件将会被创建
  },
  plugins: [
    nodeResolve(),
  ]
};
