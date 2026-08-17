/**
 * Ukryty test asercji tests/toc-sibling-nesting — zadanie
 * fix-toc-sibling-nesting.
 *
 * Dwa nazwane testy = dwa checki w check.yaml (score: fraction, skala
 * 0 / 0.5 / 1):
 *
 * 1. "rodzeństwo tego samego poziomu jest rodzeństwem" — łapie sam seed
 *    (rodzeństwo zagnieżdżane jedno pod drugim). Przechodzi też przy
 *    naprawie częściowej, która obsługuje wyłącznie równość poziomów.
 * 2. "powrót do płytszego poziomu odbudowuje właściwych rodziców" —
 *    sekwencja z zejściem w głąb i powrotem (H2 po H3, nowa sekcja H1
 *    po głębokim zagnieżdżeniu) plus parentId. Odróżnia naprawę
 *    przyczyny (poprawny warunek zdejmowania ze stosu) od łatki na
 *    objaw widoczny w pojedynczej parze rodzeństwa.
 *
 * Scenariusze celowo NIE pokrywają się 1:1 z testami repo bazowego —
 * asercja ma mierzyć zachowanie funkcji, nie to, czy agent uzielenił
 * zastany plik testów.
 */
import { describe, it, expect } from 'vitest';
import { buildTocHierarchy } from '@/utils/buildTocHierarchy';
import type { TocItem } from '@/types/toc';

function h(id: string, level: number): TocItem {
  return { id, text: id, level, children: [], parentId: null };
}

describe('buildTocHierarchy — zagnieżdżanie spisu treści', () => {
  it('rodzeństwo tego samego poziomu jest rodzeństwem', () => {
    const tree = buildTocHierarchy([h('root', 1), h('a', 2), h('b', 2), h('c', 2)]);

    expect(tree).toHaveLength(1);
    expect(tree[0].children.map((c) => c.id)).toEqual(['a', 'b', 'c']);
    for (const child of tree[0].children) {
      expect(child.children).toHaveLength(0);
      expect(child.parentId).toBe('root');
    }
  });

  it('powrót do płytszego poziomu odbudowuje właściwych rodziców', () => {
    const tree = buildTocHierarchy([
      h('s1', 1),
      h('s1-a', 2),
      h('s1-a-1', 3),
      h('s1-b', 2), // powrót z H3 na H2 — rodzicem ma być s1, nie s1-a-1
      h('s2', 1), // nowa sekcja po głębokim zagnieżdżeniu — korzeń
      h('s2-a', 2),
    ]);

    expect(tree.map((r) => r.id)).toEqual(['s1', 's2']);
    expect(tree[0].children.map((c) => c.id)).toEqual(['s1-a', 's1-b']);
    expect(tree[0].children[0].children.map((c) => c.id)).toEqual(['s1-a-1']);
    expect(tree[0].children[1].parentId).toBe('s1');
    expect(tree[1].parentId).toBeNull();
    expect(tree[1].children.map((c) => c.id)).toEqual(['s2-a']);
  });
});
