import type { TocItem, TocExtractionResult } from '@/types/toc';

/**
 * Converts a flat list of headings into a nested hierarchical tree structure
 *
 * Uses a stack-based algorithm to properly nest headings based on their levels.
 * Handles irregular nesting (e.g., H1 → H4 skipping H2/H3) gracefully.
 *
 * @param flatHeadings - Flat array of heading items
 * @returns Nested tree structure where children are nested under their parents
 *
 * @example
 * ```ts
 * const flat = [
 *   { id: '1', text: 'H1', level: 1, children: [], parentId: null },
 *   { id: '2', text: 'H2', level: 2, children: [], parentId: null },
 *   { id: '3', text: 'H3', level: 3, children: [], parentId: null },
 * ];
 * const tree = buildTocHierarchy(flat);
 * // tree[0].children[0].children[0] === third item
 * ```
 */
export function buildTocHierarchy(flatHeadings: TocItem[]): TocItem[] {
  if (flatHeadings.length === 0) return [];

  const tree: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const heading of flatHeadings) {
    // Create a new item with fresh arrays to avoid mutation
    const item: TocItem = {
      ...heading,
      children: [],
      parentId: null,
    };

    // Pop from stack until we find a valid parent (lower level)
    // or reach the root (empty stack)
    while (stack.length > 0 && stack[stack.length - 1].level > item.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      // Top-level heading - add to tree root
      tree.push(item);
    } else {
      // Nested heading - add as child of top stack item
      const parent = stack[stack.length - 1];
      item.parentId = parent.id;
      parent.children.push(item);
    }

    // Push current item onto stack for potential children
    stack.push(item);
  }

  return tree;
}

/**
 * Creates a Map for quick lookup of headings by ID
 *
 * @param flatHeadings - Flat array of heading items
 * @returns Map with heading IDs as keys and TocItems as values
 *
 * @example
 * ```ts
 * const map = buildTocMap(headings);
 * const heading = map.get('my-heading-id');
 * ```
 */
export function buildTocMap(flatHeadings: TocItem[]): Map<string, TocItem> {
  const map = new Map<string, TocItem>();

  flatHeadings.forEach((heading) => {
    map.set(heading.id, heading);
  });

  return map;
}

/**
 * Complete TOC extraction with hierarchy building and lookup map
 *
 * Combines flat list, hierarchical tree, and quick lookup map into
 * a single comprehensive result object.
 *
 * @param flatHeadings - Flat array of heading items
 * @returns Complete TOC result with tree, flat list, and lookup map
 *
 * @example
 * ```ts
 * const { tree, flatHeadings, headingMap } = buildCompleteToc(headings);
 * console.log(tree); // Nested structure for rendering
 * console.log(headingMap.get('section-1')); // Quick lookup
 * ```
 */
export function buildCompleteToc(flatHeadings: TocItem[]): TocExtractionResult {
  const tree = buildTocHierarchy(flatHeadings);
  const headingMap = buildTocMap(flatHeadings);

  return {
    flatHeadings,
    tree,
    headingMap,
  };
}
