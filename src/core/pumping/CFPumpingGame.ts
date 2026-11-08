/**
 * Context-Free Pumping Lemma Game Engine
 * Pure TypeScript — zero UI, zero DOM.
 */

import type { CFLanguageDef, CFPartition } from '../../types/pumping';

export const CF_LANGUAGES: CFLanguageDef[] = [
  {
    id: 'anbncn',
    name: 'L = { aⁿ bⁿ cⁿ | n ≥ 0 }',
    description: 'Equal numbers of a’s, b’s, and c’s in sequence',
    alphabet: ['a', 'b', 'c'],
    generateString: (m): string => 'a'.repeat(m) + 'b'.repeat(m) + 'c'.repeat(m),
    isInLanguage: (w): boolean => {
      if (!/^a*b*c*$/.test(w)) return false;
      const aCount = (w.match(/a/g) ?? []).length;
      const bCount = (w.match(/b/g) ?? []).length;
      const cCount = (w.match(/c/g) ?? []).length;
      return aCount === bCount && bCount === cCount;
    },
  },
  {
    id: 'ww',
    name: 'L = { w w | w ∈ {a, b}* }',
    description: 'Direct repetition of any string over {a, b}',
    alphabet: ['a', 'b'],
    generateString: (m): string => {
      const half = 'a'.repeat(m) + 'b';
      return half + half;
    },
    isInLanguage: (w): boolean => {
      if (w.length % 2 !== 0) return false;
      const half = w.length / 2;
      return w.slice(0, half) === w.slice(half);
    },
  },
  {
    id: 'anbncndn',
    name: 'L = { aⁿ bⁿ cⁿ dⁿ | n ≥ 0 }',
    description: 'Equal numbers of a’s, b’s, c’s, and d’s in sequence',
    alphabet: ['a', 'b', 'c', 'd'],
    generateString: (m): string => 'a'.repeat(m) + 'b'.repeat(m) + 'c'.repeat(m) + 'd'.repeat(m),
    isInLanguage: (w): boolean => {
      if (!/^a*b*c*d*$/.test(w)) return false;
      const aCount = (w.match(/a/g) ?? []).length;
      const bCount = (w.match(/b/g) ?? []).length;
      const cCount = (w.match(/c/g) ?? []).length;
      const dCount = (w.match(/d/g) ?? []).length;
      return aCount === bCount && bCount === cCount && cCount === dCount;
    },
  },
  {
    id: 'cfsquare',
    name: 'L = { a^(n²) | n ≥ 0 }',
    description: 'Unary string whose length is a square',
    alphabet: ['a'],
    generateString: (m): string => 'a'.repeat(m * m),
    isInLanguage: (w): boolean => {
      if (!/^a*$/.test(w)) return false;
      const root = Math.round(Math.sqrt(w.length));
      return root * root === w.length;
    },
  },
];

/**
 * Validates 5-segment partition w = u v x y z according to:
 * 1. |vxy| <= m
 * 2. |vy| >= 1
 * 3. uLen + vLen + xLen + yLen <= w.length
 */
export function validateCFPartition(
  w: string,
  m: number,
  uLen: number,
  vLen: number,
  xLen: number,
  yLen: number
): { valid: boolean; error?: string; partition?: CFPartition } {
  const vxyLen = vLen + xLen + yLen;
  if (vxyLen > m) {
    return {
      valid: false,
      error: `Condition |vxy| ≤ m violated: |vxy| = ${String(vxyLen)} > ${String(m)}`,
    };
  }

  const vyLen = vLen + yLen;
  if (vyLen < 1) {
    return {
      valid: false,
      error: `Condition |vy| ≥ 1 violated: |vy| = ${String(vyLen)}`,
    };
  }

  const totalPrefix = uLen + vLen + xLen + yLen;
  if (totalPrefix > w.length) {
    return {
      valid: false,
      error: `Partition length ${String(totalPrefix)} exceeds word length ${String(w.length)}`,
    };
  }

  const u = w.slice(0, uLen);
  const v = w.slice(uLen, uLen + vLen);
  const x = w.slice(uLen + vLen, uLen + vLen + xLen);
  const y = w.slice(uLen + vLen + xLen, totalPrefix);
  const z = w.slice(totalPrefix);

  return {
    valid: true,
    partition: { u, v, x, y, z },
  };
}

/**
 * Computes pumped string u v^i x y^i z.
 */
export function pumpCFString(partition: CFPartition, i: number): string {
  const { u, v, x, y, z } = partition;
  return u + v.repeat(i) + x + y.repeat(i) + z;
}

/**
 * Evaluates the pumped string against the context-free language definition.
 */
export function evaluateCFPump(
  lang: CFLanguageDef,
  partition: CFPartition,
  i: number,
  m: number
): { inLanguage: boolean; pumped: string; explanation: string } {
  const pumped = pumpCFString(partition, i);
  const inLanguage = lang.isInLanguage(pumped);

  let explanation: string;
  if (!inLanguage) {
    explanation = `Contradiction! For i = ${String(i)}, the pumped string w' = "${pumped}" does NOT belong to ${
      lang.name
    }. Because |vxy| ≤ ${String(m)}, v and y cannot contain all distinct characters in balanced proportion. This proves that ${
      lang.name
    } is not Context-Free!`;
  } else {
    explanation = `For i = ${String(i)}, the pumped string w' = "${pumped}" still satisfies the language. Try pumping with i = 0 (pumping down) or i = 2 (pumping up).`;
  }

  return {
    inLanguage,
    pumped,
    explanation,
  };
}
