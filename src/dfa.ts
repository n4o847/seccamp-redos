import { State } from './state';
import { TransitionMap } from './transitions';
import { NonEpsilonNFA, UnorderedNFA, DFA } from './types';
import { intersect } from './util';

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
  private newTransitions = new TransitionMap();
  private newStateToOldStateSet: Map<State, Set<State>> = new Map();

  constructor(private nfa: UnorderedNFA) {}

  build(): DFA {
    const queue: [State, Set<State>][] = [];
    const alphabet = this.nfa.alphabet;
    const newInitialState = State.fromSet(this.nfa.initialStateSet);
    const newAcceptingStateSet = new Set<State>();

    this.newStateList.push(newInitialState);
    this.newStateToOldStateSet.set(newInitialState, this.nfa.initialStateSet);
    queue.push([newInitialState, this.nfa.initialStateSet]);

    while (queue.length !== 0) {
      const [q0, qs0] = queue.shift()!;

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

        const q1 = State.fromSet(qs1);
        if (!this.newStateList.includes(q1)) {
          this.newStateList.push(q1);
          this.newStateToOldStateSet.set(q1, qs1);
          queue.push([q1, qs1]);
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
      table: this.newStateToOldStateSet,
    };
  }
}
