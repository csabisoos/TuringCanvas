import { describe, it, expect } from 'vitest';
import {
  CF_LANGUAGES,
  validateCFPartition,
  pumpCFString,
  evaluateCFPump,
} from '../core/pumping/CFPumpingGame';

describe('Context-Free Pumping Lemma Game Engine', () => {
  const anbncn = CF_LANGUAGES.find((l) => l.id === 'anbncn');
  if (!anbncn) throw new Error('Language anbncn not found');

  it('generates string in language of length >= m', () => {
    const w = anbncn.generateString(3);
    expect(w).toBe('aaabbbccc');
    expect(anbncn.isInLanguage(w)).toBe(true);
  });

  it('validates 5-segment partition u v x y z', () => {
    const w = 'aaabbbccc';
    const m = 3;

    // u='aa', v='a', x='b', y='b', z='bccc'
    // |vxy| = 1 + 1 + 1 = 3 <= 3, |vy| = 2 >= 1
    const res = validateCFPartition(w, m, 2, 1, 1, 1);
    expect(res.valid).toBe(true);
    expect(res.partition).toEqual({
      u: 'aa',
      v: 'a',
      x: 'b',
      y: 'b',
      z: 'bccc',
    });
  });

  it('pumps string u v^i x y^i z and demonstrates contradiction', () => {
    const partition = {
      u: 'aa',
      v: 'a',
      x: 'b',
      y: 'b',
      z: 'bccc',
    };

    // i = 0: u x z = aa + b + bccc = aabbccc -> 2 'a', 2 'b', 3 'c' -> not in L!
    const pumped0 = pumpCFString(partition, 0);
    expect(pumped0).toBe('aabbccc');
    expect(anbncn.isInLanguage(pumped0)).toBe(false);

    const evalRes = evaluateCFPump(anbncn, partition, 0, 3);
    expect(evalRes.inLanguage).toBe(false);
  });

  it('tests duplicate word language L = {w w}', () => {
    const wwLang = CF_LANGUAGES.find((l) => l.id === 'ww');
    if (!wwLang) throw new Error('ww not found');
    expect(wwLang.isInLanguage('abab')).toBe(true);
    expect(wwLang.isInLanguage('aabaab')).toBe(true);
    expect(wwLang.isInLanguage('abac')).toBe(false);
    expect(wwLang.isInLanguage('aba')).toBe(false);
  });
});
