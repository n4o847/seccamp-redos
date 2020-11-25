import {
  Char as RerejsChar,
  EscapeClass as RerejsEscapeClass,
  Class as RerejsClass,
  Dot as RerejsDot,
} from 'rerejs';

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
  alphabet: Char[];
  stateList: State[];
  initialState: State;
  acceptingState: State;
  transitions: Map<State, NullableTransition[]>;
};

export type NonEpsilonNFA = {
  type: 'NonEpsilonNFA';
  alphabet: Char[];
  stateList: State[];
  initialState: State;
  acceptingStateSet: Set<State>;
  transitions: Map<State, Map<Char, State[]>>;
};

export type StronglyConnectedComponentNFA = {
  type: 'StronglyConnectedComponentNFA';
  alphabet: Char[];
  stateList: State[];
  transitions: Map<State, Map<Char, State[]>>;
};

export type DirectProductGraph = {
  type: 'DirectProductGraph';
  alphabet: Char[];
  stateList: State[];
  transitions: Map<State, Map<Char, State[]>>;
};

export type TripleDirectProductGraph = {
  type: 'TripleDirectProductGraph';
  alphabet: Char[];
  stateList: State[];
  transitions: Map<State, Map<Char, State[]>>;
  extraTransitions: Map<State, Map<Char, State[]>>;
};

export type UnorderedNFA = {
  type: 'UnorderedNFA';
  alphabet: Char[];
  stateList: State[];
  initialStateSet: Set<State>;
  acceptingStateSet: Set<State>;
  transitions: Map<State, Map<Char, State[]>>;
};

export type DFA = {
  type: 'DFA';
  alphabet: Char[];
  stateList: State[];
  initialState: State;
  acceptingStateSet: Set<State>;
  transitions: Map<State, Map<Char, State[]>>;
};

/**
 * 通常の string と区別する。
 * State となる文字列は以下のフォーマットを満たす必要がある。
 * - 単なる状態のとき、'q' + (非負整数) となる。
 * - 状態のタプルを新たに状態とするとき、各要素を '_' で連結したものとなる。
 * - 状態の集合を新たに状態とするとき、未定。
 */
export type State = string & { __stateBrand: never };

export type Atom = RerejsChar | RerejsEscapeClass | RerejsClass | RerejsDot;

/**
 * パターンに現れる文字。
 * `null` はパターンに現れない文字を表す記号を意味する。
 *
 * 例えばパターンが `/ab.c/` の場合、パターンには `a, b, c` が現れるので、アルファベットは `'a', 'b', 'c', null` になる。
 * `.` の部分の遷移は `'a', 'b', 'c', null` について追加するようにする。
 * 否定クラスの場合も同様に、 例えば `/a[^b-d]/` の場合は、アルファベットは `'a', 'b', 'c', 'd', null` になって、
 * `[^b-d]` の部分の遷移は `'a', null` について追加する。
 */
export type Char = string | null;

export type NullableTransition =
  | {
      epsilon: false;
      char: Char;
      destination: State;
    }
  | {
      epsilon: true;
      destination: State;
    };

export type Message = {
  status: 'Safe' | 'Vulnerable' | 'Error';
  message: string;
};
