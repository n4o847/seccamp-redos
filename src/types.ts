import {
  Char as RerejsChar,
  EscapeClass as RerejsEscapeClass,
  Class as RerejsClass,
  Dot as RerejsDot,
} from 'rerejs';
import { State } from './state';
import { TransitionMap } from './transitions';

export type Automaton =
  | EpsilonNFA
  | NonEpsilonNFA
  | UnorderedNFA
  | DFA
  | StronglyConnectedComponentGraph
  | DirectProductGraph
  | TripleDirectProductGraph;

export type SCCPossibleAutomaton =
  | NonEpsilonNFA
  | DirectProductGraph
  | TripleDirectProductGraph;

export type EpsilonNFA = {
  type: 'EpsilonNFA';
  stateList: State[];
  alphabet: Set<Char>;
  initialState: State;
  acceptingState: State;
  transitions: Map<State, NullableTransition[]>;
};

export type NonEpsilonNFA = {
  type: 'NonEpsilonNFA';
  stateList: State[];
  alphabet: Set<Char>;
  initialState: State;
  acceptingStateSet: Set<State>;
  transitions: TransitionMap;
};

export type StronglyConnectedComponentGraph = {
  type: 'StronglyConnectedComponentGraph';
  stateList: State[];
  alphabet: Set<Char>;
  transitions: TransitionMap;
};

export type DirectProductGraph = {
  type: 'DirectProductGraph';
  alphabet: Set<Char>;
  stateList: State[];
  transitions: TransitionMap;
};

export type TripleDirectProductGraph = {
  type: 'TripleDirectProductGraph';
  stateList: State[];
  alphabet: Set<Char>;
  transitions: TransitionMap;
};

export type UnorderedNFA = {
  type: 'UnorderedNFA';
  stateList: State[];
  alphabet: Set<Char>;
  initialStateSet: Set<State>;
  acceptingStateSet: Set<State>;
  transitions: TransitionMap;
};

export type DFA = {
  type: 'DFA';
  stateList: State[];
  alphabet: Set<Char>;
  initialState: State;
  acceptingStateSet: Set<State>;
  transitions: TransitionMap;
  table: Map<State, Set<State>>;
};

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

export type Message =
  | {
      status: 'Safe';
      message: string;
    }
  | {
      status: 'Vulnerable';
      message: string;
      attack: string;
    }
  | {
      status: 'Error';
      message: string;
    };
