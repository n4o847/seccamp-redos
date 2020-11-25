import { NonEpsilonNFA, UnorderedNFA, DFA, State } from './types';
import { TransitionMap } from './automaton';
import { equals, intersect } from './util';

/**
 * NFA をリバースする。優先度の情報は失われる。
 */
export function reverseNFA(nfa: NonEpsilonNFA): UnorderedNFA {
  return {
    type: 'UnorderedNFA',
    alphabet: nfa.alphabet,
    stateList: nfa.stateList,
    initialStateSet: nfa.acceptingStateSet,
    acceptingStateSet: new Set([nfa.initialState]),
    transitions: nfa.transitions.reverse(),
  };
}

/**
 * 部分集合構成法を用いて NFA から DFA を構築する。
 */
export function determinize(nfa: UnorderedNFA): DFA {
  return new DFABuilder(nfa).build();
}

class DFABuilder {
  private newStateList: State[] = [];
  private newTransitions: TransitionMap;
  private newStateToOldStateSet: Map<State, Set<State>> = new Map();
  private newStateId = 0;

  constructor(private nfa: UnorderedNFA) {
    this.newTransitions = new TransitionMap(nfa.stateList, nfa.alphabet);
  }

  build(): DFA {
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
      for (const char of alphabet) {
        const qs1 = new Set(
          Array.from(qs0).flatMap((q) => this.nfa.transitions.get(q, char)),
        );

        if (qs1.size === 0) {
          continue;
        }
        let q1 = this.getState(qs1);
        if (q1 === null) {
          q1 = this.createState(qs1);
          queue.push(q1);
        }
        this.newTransitions.add(q0, char, q1);
      }
    }
    return {
      type: 'DFA',
      stateList: this.newStateList,
      alphabet,
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
    const state = `Q${this.newStateId++}` as State;
    this.newStateList.push(state);

    this.newStateToOldStateSet.set(state, oldStateSet);
    return state;
  }
}
