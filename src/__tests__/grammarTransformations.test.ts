import { describe, it, expect } from 'vitest';
import { Grammar } from '../core/grammar/Grammar';
import {
  removeLambdaProductions,
  removeUnitProductions,
  removeUselessProductions,
  convertToCNF,
} from '../core/grammar/GrammarTransformations';

describe('Grammar Transformations Pipeline', () => {
  describe('removeLambdaProductions', () => {
    it('removes nullable variables and expands combinations', () => {
      // S -> A B
      // A -> a A | ε
      // B -> b B | ε
      const text = `
        S -> A B
        A -> a A | ε
        B -> b B | ε
      `;
      const g = Grammar.fromString(text, 'S');
      const simplified = removeLambdaProductions(g.getData());

      // Productions should include S -> A B | A | B
      // No ε on A or B, but since S derives ε, start symbol may have ε or S0
      const aRules = simplified.productions.filter((p) => p.lhs === 'A');
      expect(aRules.some((p) => p.rhs.includes('ε'))).toBe(false);

      const sRules = simplified.productions.filter((p) => p.lhs === simplified.startVariable);
      expect(sRules.some((p) => p.rhs.join('') === 'AB')).toBe(true);
      expect(sRules.some((p) => p.rhs.join('') === 'A')).toBe(true);
      expect(sRules.some((p) => p.rhs.join('') === 'B')).toBe(true);
    });
  });

  describe('removeUnitProductions', () => {
    it('eliminates chain rules A -> B', () => {
      // S -> A | a
      // A -> B | b
      // B -> c
      const text = `
        S -> A | a
        A -> B | b
        B -> c
      `;
      const g = Grammar.fromString(text, 'S');
      const simplified = removeUnitProductions(g.getData());

      // S should directly derive a | b | c
      const sRhs = simplified.productions
        .filter((p) => p.lhs === 'S')
        .map((p) => p.rhs.join(''));

      expect(sRhs).toContain('a');
      expect(sRhs).toContain('b');
      expect(sRhs).toContain('c');
      expect(sRhs).not.toContain('A');
    });
  });

  describe('removeUselessProductions', () => {
    it('eliminates non-generating and unreachable variables', () => {
      // S -> a | A
      // A -> b A (never terminates, non-generating)
      // B -> c (unreachable)
      const text = `
        S -> a | A
        A -> b A
        B -> c
      `;
      const g = Grammar.fromString(text, 'S');
      const simplified = removeUselessProductions(g.getData());

      expect(simplified.variables.has('A')).toBe(false);
      expect(simplified.variables.has('B')).toBe(false);
      expect(simplified.variables.has('S')).toBe(true);
      expect(simplified.productions.length).toBe(1);
      expect(simplified.productions[0]?.rhs).toEqual(['a']);
    });
  });

  describe('convertToCNF', () => {
    it('converts grammar into Chomsky Normal Form (A -> BC or A -> a)', () => {
      // S -> a S b | a b
      const text = `
        S -> a S b | a b
      `;
      const g = Grammar.fromString(text, 'S');
      const cnf = convertToCNF(g.getData());

      // Every production must be either A -> B C (two variables) or A -> a (single terminal)
      for (const p of cnf.productions) {
        if (p.rhs.length === 1) {
          const sym = p.rhs[0] ?? '';
          expect(cnf.terminals.has(sym)).toBe(true);
        } else if (p.rhs.length === 2) {
          const first = p.rhs[0] ?? '';
          const second = p.rhs[1] ?? '';
          expect(cnf.variables.has(first)).toBe(true);
          expect(cnf.variables.has(second)).toBe(true);
        } else {
          expect(p.rhs.length).toBeLessThanOrEqual(2);
        }
      }
    });
  });
});
