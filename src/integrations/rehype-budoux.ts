import type { Plugin } from 'unified';
import type { Element, Root } from 'hast';
import rehypeStringify from 'rehype-stringify';
import { unified } from 'unified';
import { visitParents } from 'unist-util-visit-parents';
import { applyJaLineBreaks } from '../lib/budoux';

const TARGET_TAGS = new Set(['p', 'h2', 'h3', 'li', 'td']);

function isInsideCodeBlock(ancestors: readonly unknown[]): boolean {
  return ancestors.some(
    (node) =>
      node !== null &&
      typeof node === 'object' &&
      'tagName' in node &&
      ((node as Element).tagName === 'pre' || (node as Element).tagName === 'code'),
  );
}

export const rehypeBudoux: Plugin<[], Root> = () => {
  const stringify = unified().use(rehypeStringify);

  return (tree) => {
    visitParents(tree, 'element', (node, ancestors) => {
      if (!TARGET_TAGS.has(node.tagName) || isInsideCodeBlock(ancestors)) return;

      let innerHtml = '';
      for (const child of node.children) {
        const fragment: Root = { type: 'root', children: [child] };
        innerHtml += stringify.stringify(fragment);
      }

      if (!innerHtml.trim()) return;

      node.children = [
        {
          type: 'raw',
          value: applyJaLineBreaks(innerHtml),
        },
      ];
    });
  };
};
