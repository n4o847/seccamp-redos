import {
  SCCPossibleAutomaton,
  State,
  StronglyConnectedComponentGraph,
} from './types';
import { TransitionMap } from './automaton';

export function buildStronglyConnectedComponents(
  nfa: SCCPossibleAutomaton,
): StronglyConnectedComponentGraph[] {
  return new StronglyConnectedComponents(nfa).build();
}

class StronglyConnectedComponents {
  private reversedTransitions = new TransitionMap();
  private used: Map<State, boolean> = new Map();
  private order: State[] = [];
  private comp: Map<State, number> = new Map();
  private sccList: StronglyConnectedComponentGraph[] = [];

  constructor(private nfa: SCCPossibleAutomaton) {}

  build(): StronglyConnectedComponentGraph[] {
    this.nfa.stateList.forEach((state) => {
      this.used.set(state, false);
      this.comp.set(state, -1);
    });

    this.reversedTransitions = this.nfa.transitions.reverse();

    for (const state of this.nfa.stateList) {
      this.dfs(state);
    }

    let ptr = 0;
    const reversedOrder = this.order.reverse();

    for (const state of reversedOrder) {
      if (this.comp.get(state)! === -1) {
        this.rdfs(state, ptr);
        ptr++;
      }
    }

    for (const sccNFA of this.sccList) {
      for (const state of sccNFA.stateList) {
        for (const char of this.nfa.alphabet) {
          for (const destination of this.nfa.transitions.get(state, char)) {
            if (this.comp.get(state) === this.comp.get(destination)) {
              sccNFA.transitions.add(state, char, destination);
            }
          }
        }
      }
    }

    return this.sccList;
  }

  private dfs(state: State): void {
    if (this.used.get(state)!) {
      return;
    }
    this.used.set(state, true);
    for (const char of this.nfa.alphabet) {
      for (const destination of this.reversedTransitions.get(state, char)) {
        this.dfs(destination);
      }
    }
    this.order.push(state);
  }

  private rdfs(state: State, cnt: number): void {
    if (this.comp.get(state)! !== -1) {
      return;
    }

    this.comp.set(state, cnt);

    if (cnt === this.sccList.length) {
      this.sccList.push({
        type: 'StronglyConnectedComponentGraph',
        stateList: [],
        alphabet: this.nfa.alphabet,
        transitions: new TransitionMap(),
      });
    }

    const sccNFA = this.sccList[cnt];
    sccNFA.stateList.push(state);

    // 同じ強連結成分同士の集合を作る
    for (const char of this.nfa.alphabet) {
      for (const destination of this.nfa.transitions.get(state, char)) {
        this.rdfs(destination, cnt);
      }
    }
  }
}
