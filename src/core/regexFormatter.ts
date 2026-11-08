/**
 * regexFormatter — Formatting & Simplification Utilities for Regular Expressions
 *
 * Handles standard automata theory simplifications:
 * - R ∪ ∅ = R
 * - R · ε = R
 * - R · ∅ = ∅
 * - (R*)* = R*
 * - ε* = ε
 * - ∅* = ε
 */

/**
 * Checks whether an expression contains top-level union operations (outside parentheses).
 */
export function hasTopLevelUnion(expr: string): boolean {
  let depth = 0;
  for (const char of expr) {
    if (char === '(') depth++;
    else if (char === ')') depth--;
    else if (char === '+' && depth === 0) return true;
  }
  return false;
}

/**
 * Checks if the entire expression is wrapped in matching outer parentheses.
 */
export function isFullyWrappedInParentheses(expr: string): boolean {
  if (!expr.startsWith('(') || !expr.endsWith(')')) return false;
  let depth = 0;
  for (let i = 0; i < expr.length; i++) {
    const char = expr[i];
    if (char === '(') depth++;
    else if (char === ')') depth--;
    if (depth === 0 && i < expr.length - 1) return false;
  }
  return depth === 0;
}

/**
 * Simplifies a union of two regular expressions (r1 + r2).
 */
export function unionRegex(r1: string, r2: string): string {
  if (r1 === '∅' || r1 === '') return r2;
  if (r2 === '∅' || r2 === '') return r1;
  if (r1 === r2) return r1;

  // Split both if they contain top-level unions to avoid duplicates
  const terms = new Set<string>();
  const addTerms = (str: string): void => {
    let depth = 0;
    let current = '';
    for (const c of str) {
      if (c === '(') depth++;
      else if (c === ')') depth--;

      if (c === '+' && depth === 0) {
        if (current.trim().length > 0 && current !== '∅') {
          terms.add(current.trim());
        }
        current = '';
      } else {
        current += c;
      }
    }
    if (current.trim().length > 0 && current !== '∅') {
      terms.add(current.trim());
    }
  };

  addTerms(r1);
  addTerms(r2);

  if (terms.size === 0) return '∅';
  if (terms.size === 1) {
    for (const term of terms) {
      return term;
    }
  }

  return Array.from(terms).join('+');
}

/**
 * Simplifies a concatenation of two regular expressions (r1 · r2).
 */
export function concatRegex(r1: string, r2: string): string {
  if (r1 === '∅' || r2 === '∅') return '∅';
  if (r1 === 'ε' || r1 === '') return r2;
  if (r2 === 'ε' || r2 === '') return r1;

  let left = r1;
  if (hasTopLevelUnion(left) && !isFullyWrappedInParentheses(left)) {
    left = `(${left})`;
  }

  let right = r2;
  if (hasTopLevelUnion(right) && !isFullyWrappedInParentheses(right)) {
    right = `(${right})`;
  }

  return `${left}${right}`;
}

/**
 * Simplifies a Kleene Star operation (r*).
 */
export function starRegex(r: string): string {
  if (r === '∅' || r === 'ε' || r === '') return 'ε';
  if (r.endsWith('*')) return r;

  // Single literal or symbol
  if (r.length === 1) return `${r}*`;

  // Already wrapped in outer parentheses
  if (isFullyWrappedInParentheses(r)) {
    return `${r}*`;
  }

  return `(${r})*`;
}

/**
 * General cleanup of trivial redundancies.
 */
export function simplifyRegex(expr: string): string {
  let res = expr;
  // Replace ε followed by literal or vice-versa when safe
  res = res.replace(/^ε([a-zA-Z0-9])/g, '$1');
  res = res.replace(/([a-zA-Z0-9])ε$/g, '$1');
  return res;
}
