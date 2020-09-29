const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const absPath = (...dir) => path.resolve(__dirname, ...dir);
console.log('path', [absPath('node_modules'), absPath('source')]);
module.exports = {
  mode: 'development',
  // 入口文件
  entry: './src/index.js',
  // 出口文件
  output: {
    filename: 'bundle.js',
    path: absPath('dist')
  },
  // 源码映射
  devtool: 'source-map',
  // 开发服务器:dev server
  devServer: {
    contentBase: './dist'
  },
  resolve: {
    // 告诉webpack，在解析模块的时候，应该搜索哪个目录
    // node_modules存放第三方模块，source下为自己实现的Vue源码目录
    modules: [absPath('node_modules'), absPath('source')]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html'
    })
  ]
};
