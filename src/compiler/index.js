import { parseHtml } from './parse';

export function compileToFunctions (template) {
  const ast = parseHtml(template);
}
