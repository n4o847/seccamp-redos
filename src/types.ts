import { Char, EscapeClass, Class, Dot, CharSet } from 'rerejs';

export type Automaton =
  | EpsilonNFA
  | NonEpsilonNFA
  | UnorderedNFA
  | DFA
  | StronglyConnectedComponentNFA
  | DirectProductNFA
  | TripleDirectProductNFA;

export type SCCPossibleAutomaton = NonEpsilonNFA | DirectProductNFA | TripleDirectProductNFA;

export type EpsilonNFA = {
  type: 'EpsilonNFA';
  alphabet: number[];
  stateList: State[];
  initialState: State;
  acceptingState: State;
  transitions: Map<State, NullableTransition[]>;
};

export type NonEpsilonNFA = {
  type: 'NonEpsilonNFA';
  alphabet: number[];
  stateList: State[];
  initialState: State;
  acceptingStateSet: Set<State>;
  transitions: Map<State, NonNullableTransition[]>;
};

export type StronglyConnectedComponentNFA = {
  type: 'StronglyConnectedComponentNFA';
  stateList: State[];
  transitions: Map<State, NonNullableTransition[]>;
};

export type DirectProductNFA = {
  type: 'DirectProductNFA';
  stateList: State[];
  transitions: Map<State, NonNullableTransition[]>;
};

export type TripleDirectProductNFA = {
  type: 'TripleDirectProductNFA';
  stateList: State[];
  transitions: Map<State, NonNullableTransition[]>;
  extraTransitions: Map<State, NonNullableTransition[]>;
}

export type UnorderedNFA = {
  type: 'UnorderedNFA';
  alphabet: number[];
  stateList: State[];
  initialStateSet: Set<State>;
  acceptingStateSet: Set<State>;
  transitions: Map<State, NonNullableTransition[]>;
};

export type DFA = {
  type: 'DFA';
  alphabet: number[];
  stateList: State[];
  initialState: State;
  acceptingStateSet: Set<State>;
  transitions: Map<State, NonNullableTransition[]>;
};

export type State = {
  id: string;
};

export type Atom = Char | EscapeClass | Class | Dot;

export type Transition = NullableTransition | NonNullableTransition;

export type NullableTransition = {
  charSet: CharSet | null;
  destination: State;
};

export type NonNullableTransition = {
  charSet: CharSet;
  destination: State;
};

export type Message = {
  status: 'Safe' | 'Vulnerable' | 'Error';
  message: string;
};
