import { CharSet } from 'rerejs';
import {
  EpsilonNFA,
  NonEpsilonNFA,
  State,
  NonNullableTransition,
} from './types';

export function eliminateEpsilonTransitions(nfa: EpsilonNFA): NonEpsilonNFA {
  return new Eliminator(nfa).eliminate();
}

type ClosureItem = {
  accepting: true;
} | {
  accepting: false;
  charSet: CharSet;
  destination: State;
};

class Eliminator {
  private newStateList: State[] = [];
  private newTransitions: Map<State, NonNullableTransition[]> = new Map();

  constructor(
    private nfa: EpsilonNFA,
  ) {}

  eliminate(): NonEpsilonNFA {
    const queue = [];
    const newInitialState = this.nfa.initialState;
    const newAcceptingStateSet = new Set<State>();
    this.addState(newInitialState);
    queue.push(newInitialState);
    while (queue.length !== 0) {
      const q0 = queue.shift()!;
      const c = this.buildClosure(q0);
      for (const ci of c) {
        if (ci.accepting) {
          newAcceptingStateSet.add(q0);
        } else {
          const q1 = ci.destination;
          this.addTransition(q0, ci.charSet, q1);
          if (!this.newStateList.includes(q1)) {
            this.addState(q1);
            queue.push(q1);
          }
        }
      }
    }
    return {
      type: 'NonEpsilonNFA',
      alphabet: this.nfa.alphabet,
      stateList: this.newStateList,
      initialState: newInitialState,
      acceptingStateSet: newAcceptingStateSet,
      transitions: this.newTransitions,
    };
  }

  private buildClosure(q: State, path: State[] = []): ClosureItem[] {
    if (path.includes(q)) {
      return [];
    } else if (q === this.nfa.acceptingState) {
      return [{ accepting: true }];
    } else {
      return this.nfa.transitions.get(q)!.flatMap((d) => {
        if (d.charSet === null) {
          return this.buildClosure(d.destination, [...path, q]);
        } else {
          return [{ accepting: false, charSet: d.charSet, destination: d.destination }];
        }
      });
    }
  }

  private addState(oldState: State): void {
    this.newStateList.push(oldState);
    this.newTransitions.set(oldState, []);
  }

  private addTransition(source: State, charSet: CharSet, destination: State): void {
    this.newTransitions.get(source)!.push({ charSet, destination });
  }
}
