/**
 * Regular Pumping Lemma Game Engine
 * Pure TypeScript — zero UI, zero DOM.
 */

import type { RegularLanguageDef, RegularPartition } from '../../types/pumping';

function isPrime(n: number): boolean {
  if (n <= 1) return false;
  if (n <= 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

export const REGULAR_LANGUAGES: RegularLanguageDef[] = [
  {
    id: 'anbn',
    name: 'L = { aⁿ bⁿ | n ≥ 0 }',
    description: 'Strings of equal number of a’s followed by equal number of b’s',
    alphabet: ['a', 'b'],
    generateString: (m): string => 'a'.repeat(m) + 'b'.repeat(m),
    isInLanguage: (w): boolean => {
      const match = /^a*b*$/.test(w);
      if (!match) return false;
      const aCount = (w.match(/a/g) ?? []).length;
      const bCount = (w.match(/b/g) ?? []).length;
      return aCount === bCount;
    },
  },
  {
    id: 'wwR',
    name: 'L = { w wᴿ | w ∈ {a, b}* }',
    description: 'Even-length palindromes over {a, b}',
    alphabet: ['a', 'b'],
    generateString: (m): string => {
      const half = 'a'.repeat(m) + 'b';
      return half + half.split('').reverse().join('');
    },
    isInLanguage: (w): boolean => {
      if (w.length % 2 !== 0) return false;
      return w === w.split('').reverse().join('');
    },
  },
  {
    id: 'angtbm',
    name: 'L = { aⁿ bᵐ | n > m }',
    description: 'Strings where the number of a’s strictly exceeds the number of b’s',
    alphabet: ['a', 'b'],
    generateString: (m): string => 'a'.repeat(m + 1) + 'b'.repeat(m),
    isInLanguage: (w): boolean => {
      if (!/^a*b*$/.test(w)) return false;
      const aCount = (w.match(/a/g) ?? []).length;
      const bCount = (w.match(/b/g) ?? []).length;
      return aCount > bCount;
    },
  },
  {
    id: 'square',
    name: 'L = { a^(n²) | n ≥ 0 }',
    description: 'Strings whose length is a perfect square',
    alphabet: ['a'],
    generateString: (m): string => 'a'.repeat(m * m),
    isInLanguage: (w): boolean => {
      if (!/^a*$/.test(w)) return false;
      const root = Math.round(Math.sqrt(w.length));
      return root * root === w.length;
    },
  },
  {
    id: 'prime',
    name: 'L = { 0ᵖ | p is prime }',
    description: 'Strings whose length is a prime number',
    alphabet: ['0'],
    generateString: (m): string => {
      // Find smallest prime >= m
      let p = Math.max(2, m);
      while (!isPrime(p)) {
        p++;
      }
      return '0'.repeat(p);
    },
    isInLanguage: (w): boolean => {
      if (!/^0*$/.test(w)) return false;
      return isPrime(w.length);
    },
  },
  {
    id: 'anbkcnk',
    name: 'L = { aⁿ bᵏ cⁿ⁺ᵏ | n, k ≥ 0 }',
    description: 'Strings of a’s and b’s followed by c’s whose count equals the sum',
    alphabet: ['a', 'b', 'c'],
    generateString: (m): string => 'a'.repeat(m) + 'b'.repeat(m) + 'c'.repeat(2 * m),
    isInLanguage: (w): boolean => {
      if (!/^a*b*c*$/.test(w)) return false;
      const aCount = (w.match(/a/g) ?? []).length;
      const bCount = (w.match(/b/g) ?? []).length;
      const cCount = (w.match(/c/g) ?? []).length;
      return aCount + bCount === cCount;
    },
  },
];

/**
 * Validates the partition w = x y z according to:
 * 1. |xy| <= m
 * 2. |y| >= 1
 * 3. xLen + yLen <= w.length
 */
export function validatePartition(
  w: string,
  m: number,
  xLen: number,
  yLen: number
): { valid: boolean; error?: string; partition?: RegularPartition } {
  if (xLen + yLen > m) {
    return {
      valid: false,
      error: `Condition |xy| ≤ m violated: |xy| = ${String(xLen + yLen)} > ${String(m)}`,
    };
  }

  if (yLen < 1) {
    return {
      valid: false,
      error: `Condition |y| ≥ 1 violated: |y| = ${String(yLen)}`,
    };
  }

  if (xLen + yLen > w.length) {
    return {
      valid: false,
      error: `Partition length ${String(xLen + yLen)} exceeds word length ${String(w.length)}`,
    };
  }

  const x = w.slice(0, xLen);
  const y = w.slice(xLen, xLen + yLen);
  const z = w.slice(xLen + yLen);

  return {
    valid: true,
    partition: { x, y, z },
  };
}

/**
 * Computes pumped string x y^i z.
 */
export function pumpString(partition: RegularPartition, i: number): string {
  const { x, y, z } = partition;
  return x + y.repeat(i) + z;
}

/**
 * Evaluates the pumped string against the language definition.
 */
export function evaluatePump(
  lang: RegularLanguageDef,
  partition: RegularPartition,
  i: number,
  _m: number
): { inLanguage: boolean; pumped: string; explanation: string } {
  const pumped = pumpString(partition, i);
  const inLanguage = lang.isInLanguage(pumped);

  let explanation: string;
  if (!inLanguage) {
    explanation = `Contradiction! With i = ${String(i)}, the pumped string w' = "${pumped}" has length ${String(
      pumped.length
    )} which does NOT belong to ${lang.name}. This proves by the Pumping Lemma that the language is not regular!`;
  } else {
    explanation = `With i = ${String(i)}, the pumped string w' = "${pumped}" still belongs to the language. Try another value of i (such as 0 or 2) to break the invariant.`;
  }

  return {
    inLanguage,
    pumped,
    explanation,
  };
}
