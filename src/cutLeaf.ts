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
    // '(q0, {q0, q1})' => [q0, {q0,q1}]
    // DFAのSetを得るにはtableを引いた後に, さらにthis.dfa.tableを引けばいい
    const table = new Map<State, [State, State]>();

    // 全状態作成
    for (const Q0 of this.dfa.stateList) {
      for (const q0 of this.nfa.stateList) {
        const newStateTuple: [State, State] = [q0, Q0];
        const newSate = State.fromPair([q0, Q0]);
        this.newStateList.push(newSate);
        table.set(newSate, newStateTuple);
      }
    }

    for (const [q0, _] of this.dfa.table) {
      const newState = State.fromPair([this.nfa.initialState, q0]);
      newInitialStateSet.add(newState);
    }
    console.log('Initial: ', newInitialStateSet);

    for (const ass of this.dfa.acceptingStateSet) {
      const oneAcceptStateSet = this.dfa.table.get(ass)!;
      for (const q of this.nfa.stateList) {
        if (oneAcceptStateSet.has(q)) {
          const newState = State.fromPair([q, ass]);
          newAcceptingStateSet.add(newState);
        }
      }
    }

    console.log('Accept:', newAcceptingStateSet);
    console.log('Table:', table);

    // 遷移を作成
    for (const ns of this.newStateList) {
      // nsから引ける辺, つまり
      const stateTuple = table.get(ns)!;
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
}
