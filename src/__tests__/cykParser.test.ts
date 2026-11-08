import { describe, it, expect } from 'vitest';
import { Grammar } from '../core/grammar/Grammar';
import { runCYK } from '../core/grammar/CYKParser';
import { convertToCNF } from '../core/grammar/GrammarTransformations';

describe('CYK Dynamic Programming Parser', () => {
  it('parses valid strings using a CNF grammar for balanced brackets', () => {
    // S -> A B | S S
    // A -> [
    // B -> ]
    const text = `
      S -> A B | S S
      A -> [
      B -> ]
    `;
    const g = Grammar.fromString(text, 'S');
    const cnf = convertToCNF(g.getData());

    const result = runCYK(cnf, '[]');
    expect(result.accepted).toBe(true);
    expect(result.table.length).toBeGreaterThan(0);

    const resultNested = runCYK(cnf, '[][]');
    expect(resultNested.accepted).toBe(true);

    const resultInvalid = runCYK(cnf, '][');
    expect(resultInvalid.accepted).toBe(false);
  });

  it('rejects string with characters not in alphabet or derivation', () => {
    const text = `
      S -> A B
      A -> a
      B -> b
    `;
    const g = Grammar.fromString(text, 'S');
    const result = runCYK(g.getData(), 'ac');
    expect(result.accepted).toBe(false);
  });

  it('handles empty string properly', () => {
    const text = `
      S -> ε
    `;
    const g = Grammar.fromString(text, 'S');
    const result = runCYK(g.getData(), '');
    expect(result.accepted).toBe(true);
  });
});
