/**
 * RegexParser — Recursive Descent Parser for Regular Expressions
 *
 * Supported grammar:
 * Expression -> Concat ( ('+' | '|') Concat )*
 * Concat     -> Factor ( ('.' | ε) Factor )*
 * Factor     -> Primary '*'*
 * Primary    -> '(' Expression ')' | 'ε' | 'λ' | '∅' | Literal
 */
import type { RegexNode } from './RegexAST';

export function parseRegex(input: string): RegexNode {
  // Strip spaces
  const clean = input.replace(/\s+/g, '');
  if (clean.length === 0) {
    throw new Error('Regular expression cannot be empty.');
  }

  let pos = 0;

  function peek(): string | null {
    return pos < clean.length ? (clean[pos] ?? null) : null;
  }

  function consume(expected?: string): string {
    const ch = peek();
    if (ch === null) {
      throw new Error('Unexpected end of regular expression.');
    }
    if (expected !== undefined && ch !== expected) {
      throw new Error(`Expected "${expected}", found "${ch}" at index ${pos.toString()}.`);
    }
    pos++;
    return ch;
  }

  function canStartFactor(ch: string | null): boolean {
    if (ch === null) return false;
    return ch !== '+' && ch !== '|' && ch !== '*' && ch !== ')';
  }

  function parsePrimary(): RegexNode {
    const ch = peek();
    if (ch === null) {
      throw new Error('Expected an expression, found end of input.');
    }

    if (ch === '(') {
      consume('(');
      const inner = parseExpression();
      consume(')');
      return inner;
    }

    if (ch === 'ε' || ch === 'λ') {
      consume();
      return { type: 'epsilon' };
    }

    if (ch === '∅') {
      consume();
      return { type: 'empty_set' };
    }

    if (ch === '+' || ch === '|' || ch === '*' || ch === ')') {
      throw new Error(`Unexpected operator "${ch}" at index ${pos.toString()}.`);
    }

    const val = consume();
    return { type: 'literal', value: val };
  }

  function parseFactor(): RegexNode {
    let node = parsePrimary();
    while (peek() === '*') {
      consume('*');
      node = { type: 'star', child: node };
    }
    return node;
  }

  function parseConcat(): RegexNode {
    let node = parseFactor();

    while (canStartFactor(peek()) || peek() === '.') {
      if (peek() === '.') {
        consume('.');
      }
      const right = parseFactor();
      node = { type: 'concat', left: node, right };
    }

    return node;
  }

  function parseExpression(): RegexNode {
    let node = parseConcat();

    while (peek() === '+' || peek() === '|') {
      consume();
      const right = parseConcat();
      node = { type: 'union', left: node, right };
    }

    return node;
  }

  const ast = parseExpression();
  if (pos < clean.length) {
    throw new Error(`Unexpected character "${clean[pos] ?? ''}" at index ${pos.toString()}.`);
  }

  return ast;
}
