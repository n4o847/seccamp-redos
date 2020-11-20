import { CharSet } from 'rerejs';
import {
  NonEpsilonNFA,
  UnorderedNFA,
  DFA,
  State,
  NonNullableTransition,
} from './types';
import { equals, intersect } from './util';

/**
 * NFA をリバースする。優先度の情報は失われる。
 */
export function reverseNFA(nfa: NonEpsilonNFA): UnorderedNFA {
  const reversedTransitions = new Map<State, NonNullableTransition[]>();
  for (const q of nfa.stateList) {
    reversedTransitions.set(q, []);
  }
  for (const [q, ds] of nfa.transitions) {
    for (const d of ds) {
      reversedTransitions.get(d.destination)!.push({
        charSet: d.charSet,
        destination: q,
      });
    }
  }
  return {
    type: 'UnorderedNFA',
    alphabet: nfa.alphabet,
    stateList: nfa.stateList,
    initialStateSet: nfa.acceptingStateSet,
    acceptingStateSet: new Set([nfa.initialState]),
    transitions: reversedTransitions,
  };
}

/**
 * 部分集合構成法を用いて NFA から DFA を構築する。
 */
export function determinize(nfa: UnorderedNFA): DFA {
  return new Determinizer(nfa).determinize();
}

class Determinizer {
  private newStateList: State[] = [];
  private newTransitions: Map<State, NonNullableTransition[]> = new Map();
  private newStateToOldStateSet: Map<State, Set<State>> = new Map();
  private newStateId = 0;

  constructor(private nfa: UnorderedNFA) {}

  determinize(): DFA {
    const queue: State[] = [];
    const alphabet = this.nfa.alphabet;
    const newInitialState = this.createState(this.nfa.initialStateSet);
    const newAcceptingStateSet = new Set<State>();
    queue.push(newInitialState);
    while (queue.length !== 0) {
      const q0 = queue.shift()!;
      const qs0 = this.newStateToOldStateSet.get(q0)!;
      if (intersect(qs0, this.nfa.acceptingStateSet).size !== 0) {
        newAcceptingStateSet.add(q0);
      }
      console.log(alphabet);
      for (let i = 0; i < alphabet.length - 1; i++) {
        const codePointRange: [number, number] = [alphabet[i], alphabet[i + 1]];
        const qs1 = new Set(
          Array.from(qs0).flatMap((q) =>
            this.nfa.transitions
              .get(q)!
              .filter((d) => d.charSet.has(codePointRange[0]))
              .map((d) => d.destination),
          ),
        );

        if (qs1.size === 0) {
          continue;
        }
        let q1 = this.getState(qs1);
        if (q1 === null) {
          q1 = this.createState(qs1);
          queue.push(q1);
        }
        this.addTransition(q0, codePointRange, q1);
      }
    }
    return {
      type: 'DFA',
      alphabet: this.nfa.alphabet,
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
    const state: State = {
      id: `Q${this.newStateId++}`,
    };
    this.newStateList.push(state);
    this.newTransitions.set(state, []);
    this.newStateToOldStateSet.set(state, oldStateSet);
    return state;
  }

  addTransition(
    source: State,
    codePointRange: [number, number],
    destination: State,
  ): void {
    for (const d of this.newTransitions.get(source)!) {
      if (d.destination === destination) {
        d.charSet.add(codePointRange[0], codePointRange[1]);
        return;
      }
    }
    const charSet = new CharSet(codePointRange);
    this.newTransitions.get(source)!.push({ charSet, destination });
  }
}
