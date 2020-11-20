import { Char, EscapeClass, Class, Dot, CharSet } from 'rerejs';

export type Automaton =
  | EpsilonNFA
  | NonEpsilonNFA
  | UnorderedNFA
  | DFA
  | DirectProductNFA;

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

export type DirectProductNFA = {
  type: 'DirectProductNFA';
  alphabet: number[];
  stateList: State[];
  initialState: State;
  acceptingStateSet: Set<State>;
  transitions: Map<State, NonNullableTransition[]>;
};

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
