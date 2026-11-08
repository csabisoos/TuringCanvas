import { describe, it, expect } from 'vitest';
import { TM } from '../core/TM';
import type { State } from '../types/automata';

describe('Turing Machine Tape Visualizer logic (Task 4.2)', () => {
  it('correctly shifts visible tape window as head moves left and right', () => {
    const states: State[] = [
      { id: 'q0', name: 'q0', isInitial: true, isAccepting: false },
      { id: 'q1', name: 'q1', isInitial: false, isAccepting: true },
    ];
    const tm = new TM(states, new Set(['1']), new Set(['1', '0', '□']), '□');
    // Moves right 3 times then left
    tm.addTransition('q0', 'q0', '1', '0', 'R');
    tm.addTransition('q0', 'q1', '□', '1', 'L');

    const result = tm.simulate('111');
    expect(result.steps.length).toBeGreaterThanOrEqual(4);

    const step0 = result.steps[0];
    expect(step0).toBeDefined();
    expect(step0.headPosition).toBe(0);
    const center0 = step0.visibleTape.find((c) => c.index === 0);
    expect(center0).toBeDefined();
    expect(center0?.symbol).toBe('1');

    const step3 = result.steps[3];
    expect(step3).toBeDefined();
    expect(step3.headPosition).toBe(3);
    const center3 = step3.visibleTape.find((c) => c.index === 3);
    expect(center3).toBeDefined();
    expect(center3?.symbol).toBe('□');
  });

  it('handles negative head positions into left infinity', () => {
    const states: State[] = [
      { id: 'q0', name: 'q0', isInitial: true, isAccepting: false },
      { id: 'q1', name: 'q1', isInitial: false, isAccepting: true },
    ];
    const tm = new TM(states, new Set(['a']), new Set(['a', 'b', '□']), '□');
    tm.addTransition('q0', 'q1', 'a', 'b', 'L');

    const result = tm.simulate('a');
    const finalStep = result.steps[result.steps.length - 1];
    expect(finalStep).toBeDefined();
    expect(finalStep.headPosition).toBe(-1);
    const negCell = finalStep.visibleTape.find((c) => c.index === -1);
    expect(negCell).toBeDefined();
    expect(negCell?.symbol).toBe('□');
  });
});
