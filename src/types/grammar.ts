/**
 * Formal Grammar Domain Types
 */

export interface ProductionRule {
  id: string;
  lhs: string; // Nonterminal variable, e.g. "S"
  rhs: string[]; // Sequence of variables and terminals, or ["ε"]
}

export type ChomskyHierarchyType = 0 | 1 | 2 | 3;

export interface GrammarData {
  variables: Set<string>;
  terminals: Set<string>;
  startVariable: string;
  productions: ProductionRule[];
}
