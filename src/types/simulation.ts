export interface ExecutionTraceStep {
  stepIndex: number;
  symbolConsumed: string | null; // null for step 0
  activeStateIds: string[];
  activeStateLabels: string[];
}

export interface FastRunResult {
  input: string;
  accepted: boolean;
  trace: ExecutionTraceStep[];
  totalSteps: number;
}
