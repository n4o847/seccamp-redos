import * as rerejs from 'rerejs';

export type NFA =
  | EpsilonNFA
  | NonEpsilonNFA
  | UnorderedNFA;

export type EpsilonNFA = {
  type: 'EpsilonNFA';
  stateList: State[];
  initialState: State;
  acceptingState: State;
  transitions: Map<State, NullableTransition[]>;
};

export type NonEpsilonNFA = {
  type: 'NonEpsilonNFA';
  stateList: State[];
  initialState: State;
  acceptingStateSet: Set<State>;
  transitions: Map<State, NonNullableTransition[]>;
};

export type UnorderedNFA = {
  type: 'UnorderedNFA';
  stateList: State[];
  initialStateSet: Set<State>;
  acceptingStateSet: Set<State>;
  transitions: Map<State, NonNullableTransition[]>;
};

export type State = {
  id: string;
};

export type Char =
  | rerejs.Char
  | rerejs.EscapeClass
  | rerejs.Class
  | rerejs.Dot;

export type Transition =
  | NullableTransition
  | NonNullableTransition;

export type NullableTransition = {
  char: Char | null;
  destination: State;
};

export type NonNullableTransition = {
  char: Char;
  destination: State;
};
