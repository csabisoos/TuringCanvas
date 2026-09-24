/**
 * Dummy test — proves the Vitest test runner is correctly configured.
 * All real tests live alongside the modules they test (or in __tests__ subdirectories).
 */
describe('Vitest environment', () => {
  it('runs a basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('has access to global describe/it/expect without imports', () => {
    expect(typeof describe).toBe('function');
    expect(typeof it).toBe('function');
    expect(typeof expect).toBe('function');
  });

  it('can check string operations', () => {
    const projectName = 'TuringCanvas';
    expect(projectName).toContain('Turing');
    expect(projectName.toLowerCase()).toBe('turingcanvas');
  });
});
