/**
 * Abstract Syntax Tree (AST) definitions for Regular Expressions
 */

export interface LiteralNode {
  type: 'literal';
  value: string;
}

export interface EpsilonNode {
  type: 'epsilon';
}

export interface EmptySetNode {
  type: 'empty_set';
}

export interface UnionNode {
  type: 'union';
  left: RegexNode;
  right: RegexNode;
}

export interface ConcatNode {
  type: 'concat';
  left: RegexNode;
  right: RegexNode;
}

export interface StarNode {
  type: 'star';
  child: RegexNode;
}

export interface PlusNode {
  type: 'plus';
  child: RegexNode;
}

export type RegexNode =
  | LiteralNode
  | EpsilonNode
  | EmptySetNode
  | UnionNode
  | ConcatNode
  | StarNode
  | PlusNode;
