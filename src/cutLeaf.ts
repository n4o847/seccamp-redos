import { TransitionMap } from './transitions';
import { DFA, LeafCutNFA, NonEpsilonNFA } from './types';
import { State } from './state';

export function buildLeafCutNFA(nfa: NonEpsilonNFA, dfa: DFA): LeafCutNFA {
  return new LeafCutNFABuilder(nfa, dfa).build();
}

class LeafCutNFABuilder {
  private newStateList: State[] = [];
  private newTransitions = new TransitionMap();

  constructor(private nfa: NonEpsilonNFA, private dfa: DFA) {}

  build(): LeafCutNFA {
    // 初期状態作成
    const newInitialStateSet: Set<State> = new Set();
    const newAcceptingStateSet: Set<State> = new Set();
    // {q0, {q0, q1}} => [q0, Set{q0,q1}]
    const table = new Map<State, [State, Set<State>]>();

    for (const [q0, qs0] of this.dfa.table) {
      const newStateTuple: [State, Set<State>] = [this.nfa.initialState, qs0];
      const newSate = State.fromPair([this.nfa.initialState, q0]);
      newInitialStateSet.add(newSate);
      table.set(newSate, newStateTuple);
    }
    console.log('Initial: ', newInitialStateSet);

    // FIXME: 受理状態作成(Q_fがもとのNFAのstate情報を持っている必要がある)
    for (const ass of this.dfa.acceptingStateSet) {
      const oneAcceptStateSet = this.dfa.table.get(ass)!;
      for (const q of this.nfa.stateList) {
        if (oneAcceptStateSet.has(q)) {
          const newStateTuple: [State, Set<State>] = [q, oneAcceptStateSet];
          const newSate = State.fromPair([q, ass]);
          newAcceptingStateSet.add(newSate);
          table.set(newSate, newStateTuple);
        }
      }
    }
    console.log('Accept:', newAcceptingStateSet);
    console.log('Table:', table);

    return {
      type: 'LeafCutNFA',
      stateList: this.newStateList,
      alphabet: this.nfa.alphabet,
      initialState: newInitialStateSet,
      acceptingStateSet: newAcceptingStateSet,
      transitions: this.newTransitions,
    };
  }
}
