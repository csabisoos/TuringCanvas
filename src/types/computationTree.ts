/**
 * Nondeterministic Computation Tree Types
 */

export type TreeBranchStatus = 'active' | 'accept' | 'reject';

export interface TreeNode {
  id: string;
  stateId: string;
  stateLabel: string;
  remainingInput: string;
  consumedSymbol?: string;
  status: TreeBranchStatus;
  children: TreeNode[];
}
