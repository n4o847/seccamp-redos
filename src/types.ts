import * as rerejs from 'rerejs';

export type Automaton =
  | EpsilonNFA
  | NonEpsilonNFA
  | UnorderedNFA
  | DFA;

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
  transitions: Map<State, CharSetTransition[]>;
};

export type State = {
  id: string;
};

export type Atom =
  | rerejs.Char
  | rerejs.EscapeClass
  | rerejs.Class
  | rerejs.Dot;

export type Transition =
  | NullableTransition
  | NonNullableTransition;

export type NullableTransition = {
  charSet: rerejs.CharSet | null;
  destination: State;
};

export type NonNullableTransition = {
  charSet: rerejs.CharSet;
  destination: State;
};

export type CharSetTransition = {
  charSet: rerejs.CharSet;
  destination: State;
};
