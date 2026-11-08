/**
 * Formal Grammar Core Implementation
 * Pure TypeScript — zero UI, zero DOM.
 */

import type { ChomskyHierarchyType, GrammarData, ProductionRule } from '../../types/grammar';

export class Grammar {
  private data: GrammarData;

  constructor(data: GrammarData) {
    this.data = data;
  }

  public getData(): GrammarData {
    return this.data;
  }

  /**
   * Parses a multiline string representation of a grammar into a Grammar instance.
   * e.g.:
   *   S -> a S b | ε
   *   A -> c A | d
   */
  public static fromString(text: string, defaultStartVar = 'S'): Grammar {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'));

    const variables = new Set<string>();
    const terminals = new Set<string>();
    const productions: ProductionRule[] = [];
    let startVar = defaultStartVar;
    let ruleIdx = 1;

    for (const line of lines) {
      // Find arrow: ->, →, or -->
      const arrowMatch = /(-->|->|→)/.exec(line);
      if (!arrowMatch) continue;

      const arrow = arrowMatch[0];
      const arrowIndex = line.indexOf(arrow);
      const lhs = line.slice(0, arrowIndex).trim();
      const rhsPart = line.slice(arrowIndex + arrow.length).trim();

      if (!lhs) continue;
      variables.add(lhs);
      if (productions.length === 0 && !defaultStartVar) {
        startVar = lhs;
      }

      // Split RHS by |
      const alternates = rhsPart.split('|').map((alt) => alt.trim()).filter(Boolean);

      // Check if RHS uses space-separated tokens
      const useSpaces = rhsPart.includes(' ');

      for (const alt of alternates) {
        // Parse RHS symbols
        let rhsTokens: string[];
        if (alt === 'ε' || alt === '^' || alt.toLowerCase() === 'lambda' || alt.toLowerCase() === 'epsilon') {
          rhsTokens = ['ε'];
        } else if (useSpaces) {
          // Space-separated tokens across the line
          rhsTokens = alt.split(/\s+/).filter(Boolean);
        } else {
          // Character-by-character tokens
          rhsTokens = alt.split('');
        }

        // Classify tokens as variables (uppercase or multi-char starting with uppercase) or terminals
        for (const tok of rhsTokens) {
          if (tok === 'ε') continue;
          if (/^[A-Z][0-9A-Z_]*$/.test(tok)) {
            variables.add(tok);
          } else {
            terminals.add(tok);
          }
        }

        productions.push({
          id: `p_${String(ruleIdx++)}`,
          lhs,
          rhs: rhsTokens,
        });
      }
    }

    if (!variables.has(startVar) && productions.length > 0) {
      startVar = productions[0].lhs;
    }

    return new Grammar({
      variables,
      terminals,
      startVariable: startVar,
      productions,
    });
  }

  /**
   * Classifies the grammar according to the Chomsky Hierarchy:
   * 3 = Regular
   * 2 = Context-Free
   * 1 = Context-Sensitive
   * 0 = Unrestricted
   */
  public classifyChomsky(): ChomskyHierarchyType {
    const { variables, terminals, productions } = this.data;

    // Check if every rule has a single variable on LHS
    const isContextFree = productions.every(
      (p) => variables.has(p.lhs) && !p.lhs.includes(' ')
    );

    if (!isContextFree) {
      // Check for Context-Sensitive (|LHS| <= |RHS|)
      const isContextSensitive = productions.every((p) => {
        if (p.rhs.length === 1 && p.rhs[0] === 'ε') {
          return p.lhs === this.data.startVariable;
        }
        return p.lhs.length <= p.rhs.length;
      });
      return isContextSensitive ? 1 : 0;
    }

    // Check if Regular (Type 3)
    // Right-linear: A -> w B or A -> w where w in Sigma* and B in V
    // Left-linear: A -> B w or A -> w
    let isRightLinear = true;
    let isLeftLinear = true;

    for (const p of productions) {
      if (p.rhs.length === 1 && p.rhs[0] === 'ε') {
        continue;
      }

      // Count variables in RHS
      const varCount = p.rhs.filter((s) => variables.has(s)).length;
      if (varCount > 1) {
        isRightLinear = false;
        isLeftLinear = false;
        break;
      }

      if (varCount === 1) {
        const last = p.rhs[p.rhs.length - 1] ?? '';
        const first = p.rhs[0] ?? '';
        if (!variables.has(last)) isRightLinear = false;
        if (!variables.has(first)) isLeftLinear = false;
      } else {
        // Only terminals
        const allTerminals = p.rhs.every((s) => terminals.has(s));
        if (!allTerminals) {
          isRightLinear = false;
          isLeftLinear = false;
        }
      }
    }

    if (isRightLinear || isLeftLinear) {
      return 3;
    }

    return 2;
  }

  public toString(): string {
    const rulesByLhs = new Map<string, string[][]>();
    for (const p of this.data.productions) {
      const existing = rulesByLhs.get(p.lhs) ?? [];
      existing.push(p.rhs);
      rulesByLhs.set(p.lhs, existing);
    }

    const lines: string[] = [];
    for (const [lhs, alts] of rulesByLhs) {
      const altStr = alts.map((rhs) => (rhs.length === 1 && rhs[0] === 'ε' ? 'ε' : rhs.join(' '))).join(' | ');
      lines.push(`${lhs} -> ${altStr}`);
    }
    return lines.join('\n');
  }
}
