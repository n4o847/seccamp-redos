import { CharSet } from 'rerejs';
import {
  NonEpsilonNFA,
  UnorderedNFA,
  DFA,
  State,
  NonNullableTransition,
  CharSetTransition,
} from './types';
import { alphabet, contains } from './char';
import { equals, intersect } from './util';

export function reverseNFA(nfa: NonEpsilonNFA): UnorderedNFA {
  const reversedTransitions = new Map<State, NonNullableTransition[]>();
  for (const q of nfa.stateList) {
    reversedTransitions.set(q, []);
  }
  for (const [q, ds] of nfa.transitions) {
    for (const d of ds) {
      reversedTransitions.get(d.destination)!.push({
        char: d.char,
        destination: q,
      });
    }
  }
  return {
    type: 'UnorderedNFA',
    stateList: nfa.stateList,
    initialStateSet: nfa.acceptingStateSet,
    acceptingStateSet: new Set([nfa.initialState]),
    transitions: reversedTransitions,
  };
}

export function determinize(nfa: UnorderedNFA): DFA {
  return new Determinizer(nfa).determinize();
}

class Determinizer {
  private newStateList: State[] = [];
  private newTransitions: Map<State, CharSetTransition[]> = new Map();
  private newStateToOldStateSet: Map<State, Set<State>> = new Map();
  private newStateId = 0;

  constructor(
    private nfa: UnorderedNFA,
  ) {}

  determinize(): DFA {
    const queue: State[] = [];
    const newInitialState = this.createState(this.nfa.initialStateSet);
    const newAcceptingStateSet = new Set<State>();
    queue.push(newInitialState);
    while (queue.length !== 0) {
      const q0 = queue.shift()!;
      const qs0 = this.newStateToOldStateSet.get(q0)!;
      if (intersect(qs0, this.nfa.acceptingStateSet).size !== 0) {
        newAcceptingStateSet.add(q0);
      }
      for (const a of alphabet) {
        const qs1 = new Set(Array.from(qs0).flatMap((q) => this.nfa.transitions.get(q)!.filter((d) => contains(d.char, a)).map((d) => d.destination)));
        if (qs1.size === 0) {
          continue;
        }
        let q1 = this.getState(qs1);
        if (q1 === null) {
          q1 = this.createState(qs1);
          queue.push(q1);
        }
        this.addTransition(q0, a, q1);
      }
    }
    return {
      type: 'DFA',
      stateList: this.newStateList,
      initialState: newInitialState,
      acceptingStateSet: newAcceptingStateSet,
      transitions: this.newTransitions,
    };
  }

  getState(oldStateSet: Set<State>): State | null {
    for (const [q, qs] of this.newStateToOldStateSet) {
      if (equals(qs, oldStateSet)) {
        return q;
      }
    }
    return null;
  }

  createState(oldStateSet: Set<State>): State {
    const state = {
      id: `Q${this.newStateId++}`,
    };
    this.newStateList.push(state);
    this.newTransitions.set(state, []);
    this.newStateToOldStateSet.set(state, oldStateSet);
    return state;
  }

  addTransition(source: State, codePoint: number, destination: State): void {
    for (const d of this.newTransitions.get(source)!) {
      if (d.destination === destination) {
        d.charSet.add(codePoint, codePoint + 1);
        return;
      }
    }
    const charSet = new CharSet([codePoint, codePoint + 1]);
    this.newTransitions.get(source)!.push({ charSet, destination });
  }
}
