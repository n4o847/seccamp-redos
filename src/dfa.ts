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
  const queue: [State, Set<State>][] = [];

  const newStateList: State[] = [];
  const newTransitions = new TransitionMap();
  const newInitialState = State.fromSet(nfa.initialStateSet);
  const newAcceptingStateSet = new Set<State>();
  const table = new Map<State, Set<State>>();

  newStateList.push(newInitialState);
  table.set(newInitialState, nfa.initialStateSet);
  queue.push([newInitialState, nfa.initialStateSet]);

  while (queue.length !== 0) {
    const [q0, qs0] = queue.shift()!;

    if (intersect(qs0, nfa.acceptingStateSet).size !== 0) {
      newAcceptingStateSet.add(q0);
    }

    for (const char of nfa.alphabet) {
      const qs1 = new Set(
        Array.from(qs0).flatMap((q) => nfa.transitions.get(q, char)),
      );

      const q1 = State.fromSet(qs1);
      if (!newStateList.includes(q1)) {
        newStateList.push(q1);
        table.set(q1, qs1);
        queue.push([q1, qs1]);
      }

      newTransitions.add(q0, char, q1);
    }
  }

  return {
    type: 'DFA',
    stateList: newStateList,
    alphabet: nfa.alphabet,
    initialState: newInitialState,
    acceptingStateSet: newAcceptingStateSet,
    transitions: newTransitions,
    table,
  };
}
