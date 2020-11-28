import { TransitionMap } from './transitions';
import { DFA, PruningNFA, NonEpsilonNFA } from './types';
import { State } from './state';

export function prune(nfa: NonEpsilonNFA, dfa: DFA): PruningNFA {
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

  // There is a transition `q1 --(char)-> qs` in ordered NFA, and
  // there is a transition `Q1 <-(char)-- Q2` in reversed DFA.
  // The result NFA contains a transition `(q1, Q1) --(char)-> (qs(i), Q2)`
  // if and only if there is no `qs(j)` (`j < i`) in `Q2`.
  for (const [q1, char] of nfa.transitions.getSourceChar()) {
    const qs = nfa.transitions.get(q1, char);
    for (const [Q2, Q1] of dfa.transitions.getTuplesFromChar(char)) {
      for (const qsi of qs) {
        if (dfa.table.get(Q2)!.has(qsi)) {
          newTransitions.add(
            State.fromPair([q1, Q1]),
            char,
            State.fromPair([qsi, Q2]),
          );
          break;
        }
      }
    }
  }

  return {
    type: 'PruningNFA',
    stateList: newStateList,
    alphabet: nfa.alphabet,
    initialState: newInitialStateSet,
    acceptingStateSet: newAcceptingStateSet,
    transitions: newTransitions,
  };
}
