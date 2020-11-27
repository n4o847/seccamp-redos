import { TransitionMap } from './automaton';
import { DFA, LeafCutNFA, NonEpsilonNFA, State } from './types';

export function buildLeafCutNFA(nfa: NonEpsilonNFA, dfa: DFA): LeafCutNFA {
  return new LeafCutNFABuilder(nfa, dfa).build();
}

export function getNFAState(state: State): State {
  return state.split('_')[0] as State;
}

export function getDFAState(state: State): State {
  return state.split('_')[1] as State;
}

class LeafCutNFABuilder {
  private newStateList: State[] = [];
  private newTransitions = new TransitionMap();

  constructor(private nfa: NonEpsilonNFA, private dfa: DFA) {}

  build(): LeafCutNFA {
    // 初期状態作成
    const newInitialStateSet: Set<State> = new Set();
    const newAcceptingStateSet: Set<State> = new Set();
    for (const s of this.dfa.stateList) {
      newInitialStateSet.add(this.createState(this.nfa.initialState, s));
    }

    // 受理状態作成
    for (const ns of this.nfa.acceptingStateSet) {
      if (this.dfa.acceptingStateSet.has(ns)) {
        for (const ds of this.dfa.initialState) {
          newAcceptingStateSet.add(this.createState(ns, ds as State));
        }
      }
    }

    return {
      type: 'LeafCutNFA',
      stateList: this.newStateList,
      alphabet: this.nfa.alphabet,
      initialState: newInitialStateSet,
      acceptingStateSet: newAcceptingStateSet,
      transitions: this.newTransitions,
    };
  }

  createState(leftState: State, rightState: State): State {
    const state = `${leftState}_${rightState}` as State;

    this.newStateList.push(state);
    return state;
  }
}
