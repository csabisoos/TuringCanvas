export interface TestCase {
  id: string;
  input: string;
  expected?: 'accept' | 'reject';
  actual?: 'accept' | 'reject' | 'error';
  passed?: boolean;
  errorMessage?: string;
}
