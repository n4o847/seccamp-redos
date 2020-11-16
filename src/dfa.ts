import {
  NonEpsilonNFA,
  UnorderedNFA,
  State,
  NonNullableTransition,
} from './types';

export function reverseNFA(nfa: NonEpsilonNFA): UnorderedNFA {
  const reversedTransitions = new Map<State, NonNullableTransition[]>();
  for (const [q, ds] of nfa.transitions) {
    for (const d of ds) {
      if (!reversedTransitions.has(d.destination)) {
        reversedTransitions.set(d.destination, []);
      }
      reversedTransitions.get(d.destination)!.push({
        char: d.char,
        destination: q,
      });
    }
  }
  return {
    type: 'UnorderedNFA',
    stateList: nfa.stateList,
    initialStateSet: nfa.acceptingStateSet,
    acceptingStateSet: new Set([nfa.initialState]),
    transitions: reversedTransitions,
  };
}
