import * as rerejs from 'rerejs';

export type NFA =
  | NormalizedNFA
  | NonNormalizedNFA;

export type NormalizedNFA = {
  normalized: true;
  states: State[];
  initialState: State;
  acceptingState: State;
  transitions: Map<State, Transition[]>;
};

export type NonNormalizedNFA = {
  normalized: false;
  states: State[];
  initialState: State;
  acceptingStates: Set<State>;
  transitions: Map<State, Transition[]>;
};

export type State = {
  id: string;
};

export type Char =
  | rerejs.Char
  | rerejs.EscapeClass
  | rerejs.Class
  | rerejs.Dot;

export type Transition = {
  char: Char | null;
  destination: State;
};
