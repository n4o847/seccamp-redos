import { Char, EscapeClass, Class, Dot, CharSet } from 'rerejs';

export type Automaton =
  | EpsilonNFA
  | NonEpsilonNFA
  | UnorderedNFA
  | DFA
  | StronglyConnectedComponentNFA
  | DirectProductGraph
  | TripleDirectProductGraph;

export type SCCPossibleAutomaton =
  | NonEpsilonNFA
  | DirectProductGraph
  | TripleDirectProductGraph;

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

export type DirectProductGraph = {
  type: 'DirectProductGraph';
  stateList: State[];
  transitions: Map<State, NonNullableTransition[]>;
};

export type TripleDirectProductGraph = {
  type: 'TripleDirectProductGraph';
  stateList: State[];
  transitions: Map<State, NonNullableTransition[]>;
  extraTransitions: Map<State, NonNullableTransition[]>;
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

/**
 * 通常の string と区別する。
 * State となる文字列は以下のフォーマットを満たす必要がある。
 * - 単なる状態のとき、'q' + (非負整数) となる。
 * - 状態のタプルを新たに状態とするとき、各要素を '_' で連結したものとなる。
 * - 状態の集合を新たに状態とするとき、未定。
 */
export type State = string & { __stateBrand: never };

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
