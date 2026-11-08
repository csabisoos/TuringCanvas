import { describe, it, expect } from 'vitest';
import {
  REGULAR_LANGUAGES,
  validatePartition,
  pumpString,
  evaluatePump,
} from '../core/pumping/RegularPumpingGame';

describe('Regular Pumping Lemma Game Engine', () => {
  const anbn = REGULAR_LANGUAGES.find((l) => l.id === 'anbn');
  if (!anbn) throw new Error('Language anbn not found');

  it('generates test string w of length >= m in language', () => {
    const w = anbn.generateString(3);
    expect(w).toBe('aaabbb');
    expect(anbn.isInLanguage(w)).toBe(true);
  });

  it('validates partition adhering to |xy| <= m and |y| >= 1', () => {
    const w = 'aaabbb';
    const m = 3;

    // Valid: x='a', y='aa' (|xy|=3 <= 3, |y|=2 >= 1)
    const validRes = validatePartition(w, m, 1, 2);
    expect(validRes.valid).toBe(true);
    expect(validRes.partition).toEqual({ x: 'a', y: 'aa', z: 'bbb' });

    // Invalid: |xy| = 4 > m
    const invalidRes1 = validatePartition(w, m, 2, 2);
    expect(invalidRes1.valid).toBe(false);
    expect(invalidRes1.error).toMatch(/\|xy\|/);

    // Invalid: |y| = 0
    const invalidRes2 = validatePartition(w, m, 2, 0);
    expect(invalidRes2.valid).toBe(false);
    expect(invalidRes2.error).toMatch(/\|y\|/);
  });

  it('pumps string x y^i z and detects contradiction', () => {
    const partition = { x: 'a', y: 'aa', z: 'bbb' };
    // i = 0: x z = a bbb -> 1 'a' and 3 'b' -> not in L!
    const pumped0 = pumpString(partition, 0);
    expect(pumped0).toBe('abbb');
    expect(anbn.isInLanguage(pumped0)).toBe(false);

    // i = 2: x y y z = a aaaa bbb -> 5 'a' and 3 'b' -> not in L!
    const pumped2 = pumpString(partition, 2);
    expect(pumped2).toBe('aaaaabbb');
    expect(anbn.isInLanguage(pumped2)).toBe(false);

    const evalRes = evaluatePump(anbn, partition, 0, 3);
    expect(evalRes.inLanguage).toBe(false);
  });

  it('tests square length language L = {a^(n^2)}', () => {
    const sqLang = REGULAR_LANGUAGES.find((l) => l.id === 'square');
    if (!sqLang) throw new Error('square not found');
    expect(sqLang.isInLanguage('a')).toBe(true); // 1^2
    expect(sqLang.isInLanguage('aaaa')).toBe(true); // 2^2 = 4
    expect(sqLang.isInLanguage('aaaaaaaaa')).toBe(true); // 3^2 = 9
    expect(sqLang.isInLanguage('aaaaa')).toBe(false); // 5 not square
  });

  it('tests prime length language L = {0^p}', () => {
    const primeLang = REGULAR_LANGUAGES.find((l) => l.id === 'prime');
    if (!primeLang) throw new Error('prime not found');
    expect(primeLang.isInLanguage('00')).toBe(true); // 2
    expect(primeLang.isInLanguage('000')).toBe(true); // 3
    expect(primeLang.isInLanguage('0000')).toBe(false); // 4
    expect(primeLang.isInLanguage('00000')).toBe(true); // 5
  });
});
