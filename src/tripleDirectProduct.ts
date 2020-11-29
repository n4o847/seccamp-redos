import { State } from './state';
import { TransitionMap } from './transitions';
import {
  TripleDirectProductGraph,
  StronglyConnectedComponentGraph,
  SCCPossibleAutomaton,
} from './types';

export function buildTripleDirectProductGraphs(
  sccs: StronglyConnectedComponentGraph[],
  nfa: SCCPossibleAutomaton,
): TripleDirectProductGraph[] {
  return sccs
    .map((scc1, _, sccs) =>
      sccs
        .filter((scc2) => scc1 !== scc2)
        .map((scc2) => buildTripleDirectProductGraph(scc1, nfa, scc2)),
    )
    .flat(1);
}

export function buildTripleDirectProductGraph(
  sccGraph1: StronglyConnectedComponentGraph,
  nfa: SCCPossibleAutomaton,
  sccGraph2: StronglyConnectedComponentGraph,
): TripleDirectProductGraph {
  return new TripleDirectProductBuilder(sccGraph1, nfa, sccGraph2).build();
}

class TripleDirectProductBuilder {
  private newStateList: State[] = [];
  private newTransitions = new TransitionMap();
  private table: Map<State, [State, State, State]> = new Map();

  constructor(
    private sccGraph1: StronglyConnectedComponentGraph,
    private nfa: SCCPossibleAutomaton,
    private sccGraph2: StronglyConnectedComponentGraph,
  ) {}

  build(): TripleDirectProductGraph {
    for (const lq of this.sccGraph1.stateList) {
      for (const cq of this.nfa.stateList) {
        for (const rq of this.sccGraph2.stateList) {
          for (const char of this.nfa.alphabet) {
            for (const ld of this.sccGraph1.transitions.get(lq, char)) {
              for (const cd of this.nfa.transitions.get(cq, char)) {
                for (const rd of this.sccGraph2.transitions.get(rq, char)) {
                  const source = this.createState(lq, cq, rq);
                  const dest = this.createState(ld, cd, rd);
                  this.newTransitions.add(source, char, dest);
                }
              }
            }
          }
        }
      }
    }

    // IDA判定のために、強連結成分間の戻る辺を追加
    for (const lq of this.sccGraph1.stateList) {
      for (const rq of this.sccGraph2.stateList) {
        for (const a of this.nfa.alphabet) {
          const source = this.createState(lq, rq, rq);
          const dest = this.createState(lq, lq, rq);
          this.newTransitions.add(source, a, dest);
        }
      }
    }

    return {
      type: 'TripleDirectProductGraph',
      stateList: this.newStateList,
      alphabet: this.nfa.alphabet,
      transitions: this.newTransitions,
      table: this.table,
    };
  }

  private createState(
    leftState: State,
    centerState: State,
    rightState: State,
  ): State {
    const newState = State.fromTriple([leftState, centerState, rightState]);
    if (!this.newStateList.includes(newState)) {
      this.newStateList.push(newState);
      this.table.set(newState, [leftState, centerState, rightState]);
    }
    return newState;
  }
}
