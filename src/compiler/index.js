import { parseHtml } from './parse';
import { generate } from './generate';

export function compileToFunctions (template) {
  // 将html解析为ast语法树
  const ast = parseHtml(template);
  // 通过ast语法树生成代码字符串
  const code = generate(ast);
  // 将字符串转换为函数
  return new Function(`with(this){return ${code}}`);
}
