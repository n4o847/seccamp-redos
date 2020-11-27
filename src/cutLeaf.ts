import { TransitionMap } from './transitions';
import { DFA, LeafCutNFA, NonEpsilonNFA } from './types';
import { State } from './state';

export function buildLeafCutNFA(nfa: NonEpsilonNFA, dfa: DFA): LeafCutNFA {
  const newStateList: State[] = [];
  const newTransitions = new TransitionMap();
  const newInitialStateSet: Set<State> = new Set();
  const newAcceptingStateSet: Set<State> = new Set();
  //  ex: '(q0, {q0, q1})' => ['q0', '{q0,q1}']
  const table = new Map<State, [State, State]>();

  // 全状態作成
  for (const q0 of nfa.stateList) {
    for (const Q0 of dfa.stateList) {
      const newStateTuple: [State, State] = [q0, Q0];
      const newState = State.fromPair([q0, Q0]);
      newStateList.push(newState);
      table.set(newState, newStateTuple);
    }
  }

  // 初期状態作成
  for (const q0 of dfa.stateList) {
    const newState = State.fromPair([nfa.initialState, q0]);
    newInitialStateSet.add(newState);
  }
  // console.log('Initial: ', newInitialStateSet);

  // 受理状態作成、Q_fはReverseDFAの初期状態
  {
    const initialStateSet = dfa.table.get(dfa.initialState)!;
    for (const q of nfa.stateList) {
      if (initialStateSet.has(q)) {
        const newState = State.fromPair([q, dfa.initialState]);
        newAcceptingStateSet.add(newState);
      }
    }
  }

  // console.log('Accept:', newAcceptingStateSet);
  // console.log('Table:', table);

  /**
   * ある文字charでdfaSourceからdfaDestに遷移
   * dfaDestに含まれるNFA上のq0からchar遷移において到達できる一番最初の点q1への辺を追加
   */
  for (const [dfaSource, char, dfaDest] of dfa.transitions) {
    const dfaSourceSet = dfa.table.get(dfaSource)!;
    for (const q0 of dfa.table.get(dfaDest)!) {
      const nfaDestList = nfa.transitions.get(q0, char);
      for (const q1 of nfaDestList) {
        if (
          dfaSourceSet.has(q1) &&
          !newTransitions.has(
            State.fromPair([q0, dfaDest]),
            char,
            State.fromPair([q1, dfaSource]),
          )
        ) {
          newTransitions.add(
            State.fromPair([q0, dfaDest]),
            char,
            State.fromPair([q1, dfaSource]),
          );
        }
      }
    }
  }

  return {
    type: 'LeafCutNFA',
    stateList: newStateList,
    alphabet: nfa.alphabet,
    initialState: newInitialStateSet,
    acceptingStateSet: newAcceptingStateSet,
    transitions: newTransitions,
  };
}
