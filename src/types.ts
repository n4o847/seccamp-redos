import * as rerejs from 'rerejs';

export type NFA =
  | EpsilonNFA
  | NonEpsilonNFA;

export type EpsilonNFA = {
  type: 'EpsilonNFA';
  states: State[];
  initialState: State;
  acceptingState: State;
  transitions: Map<State, NullableTransition[]>;
};

export type NonEpsilonNFA = {
  type: 'NonEpsilonNFA';
  states: State[];
  initialState: State;
  acceptingStates: Set<State>;
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
