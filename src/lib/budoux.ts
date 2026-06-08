import { HTMLProcessingParser, jaModel } from 'budoux';
import { parseHTML } from 'linkedom';

const { document } = parseHTML('');
const wbr = document.createElement('wbr');

const parser = new HTMLProcessingParser(jaModel, {
  className: 'budoux',
  separator: wbr,
});

/** プレーンテキストまたはインライン HTML に BudouX の改行ヒントを挿入する。 */
export function applyJaLineBreaks(text: string): string {
  if (!text) return text;
  return parser.translateHTMLString(text);
}
