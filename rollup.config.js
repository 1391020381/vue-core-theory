import resolve from '@rollup/plugin-node-resolve';
import serve from 'rollup-plugin-serve';

export default {
  input: 'src/index.js',
  output: {
    name: 'Vue',
    file: 'dist/vue.js',
    format: 'umd'
  },
  plugins: [
    resolve(),
    serve({
      open: true,
      openPage: '/usage/index.html'
    })
  ]
};
