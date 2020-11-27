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

  const alphabet = nfa.alphabet;
  const stateList: State[] = [];
  const transitions = new TransitionMap();
  const initialState = State.fromSet(nfa.initialStateSet);
  const acceptingStateSet = new Set<State>();
  const table = new Map<State, Set<State>>();

  stateList.push(initialState);
  table.set(initialState, nfa.initialStateSet);
  queue.push([initialState, nfa.initialStateSet]);

  while (queue.length !== 0) {
    const [q0, qs0] = queue.shift()!;

    if (intersect(qs0, nfa.acceptingStateSet).size !== 0) {
      acceptingStateSet.add(q0);
    }

    for (const char of alphabet) {
      const qs1 = new Set(
        Array.from(qs0).flatMap((q) => nfa.transitions.get(q, char)),
      );

      if (qs1.size === 0) {
        continue;
      }

      const q1 = State.fromSet(qs1);
      if (!stateList.includes(q1)) {
        stateList.push(q1);
        table.set(q1, qs1);
        queue.push([q1, qs1]);
      }

      transitions.add(q0, char, q1);
    }
  }
  return {
    type: 'DFA',
    stateList,
    alphabet,
    initialState,
    acceptingStateSet,
    transitions,
    table,
  };
}
