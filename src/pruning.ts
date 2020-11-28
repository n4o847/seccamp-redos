import { TransitionMap } from './transitions';
import { DFA, PrunedNFA, NonEpsilonNFA, Char } from './types';
import { State } from './state';

/**
 * NFAとReverseDFAから枝刈りされたNFAを作成
 */
export function prune(nfa: NonEpsilonNFA, dfa: DFA): PrunedNFA {
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

  // There is a transition `q1 --(char)-> qs` in ordered NFA, and
  // there is a transition `Q1 <-(char)-- Q2` in reversed DFA.
  // The result NFA contains a transition `(q1, Q1) --(char)-> (qs(i), Q2)`
  // if and only if there is no `qs(j)` (`j < i`) in `Q2`.
  for (const [q1, char] of nfa.transitions.getSourceCharTuples()) {
    const qs = nfa.transitions.get(q1, char);
    for (const [Q2, Q1] of dfa.transitions.getTuplesFromChar(char)) {
      const Q2Set = dfa.table.get(Q2)!;
      for (const qsi of qs) {
        newTransitions.add(
          State.fromPair([q1, Q1]),
          char,
          State.fromPair([qsi, Q2]),
        );

        if (Q2Set.has(qsi)) {
          break;
        }
      }
    }
  }

  return removeUnreachableState({
    type: 'PrunedNFA',
    stateList: newStateList,
    alphabet: nfa.alphabet,
    initialStateSet: newInitialStateSet,
    acceptingStateSet: newAcceptingStateSet,
    transitions: newTransitions,
  });
}

/**
 * 初期状態から幅優先探索をして到達できる点のみのNFAを作成
 * 到達不能なStateを除去し、そのState内における遷移とアルファベットのみを追加
 * TODO: Viz謝表示時を修正(本来二重でない辺を二重に描いてしまう)
 */
function removeUnreachableState(pnfa: PrunedNFA): PrunedNFA {
  const newStateList: State[] = [];
  const newAcceptingStateSet: Set<State> = new Set();
  const newAlphabet: Set<Char> = new Set();
  const newTransitions = new TransitionMap();

  const queue: State[] = Array.from(pnfa.initialStateSet);
  const visited: Map<State, boolean> = new Map();

  pnfa.stateList.forEach((state) => {
    visited.set(state, false);
  });

  while (queue.length !== 0) {
    const source = queue.shift()!;
    visited.set(source, true);
    newStateList.push(source);

    if (pnfa.acceptingStateSet.has(source)) {
      newAcceptingStateSet.add(source);
    }

    for (const [_, dests] of pnfa.transitions.getTransitions(source)!) {
      for (const dest of dests) {
        if (!visited.get(dest)!) {
          queue.push(dest);
        }
      }
    }
  }

  const newStateSet = new Set(newStateList);
  for (const [q0, char, q1] of pnfa.transitions) {
    if (newStateSet.has(q0) && newStateSet.has(q1)) {
      newTransitions.add(q0, char, q1);
      newAlphabet.add(char);
    }
  }

  return {
    type: 'PrunedNFA',
    stateList: newStateList,
    alphabet: newAlphabet,
    initialStateSet: pnfa.initialStateSet,
    acceptingStateSet: newAcceptingStateSet,
    transitions: newTransitions,
  };
}
