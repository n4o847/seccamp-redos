import { State } from './state';
import { TransitionMap } from './transitions';
import { DirectProductGraph, StronglyConnectedComponentGraph } from './types';

export function buildDirectProductGraphs(
  sccs: StronglyConnectedComponentGraph[],
): DirectProductGraph[] {
  return sccs.map((scc) => buildDirectProductGraph(scc));
}

export function buildDirectProductGraph(
  sccGraph: StronglyConnectedComponentGraph,
): DirectProductGraph {
  return new DirectProductBuilder(sccGraph).build();
}

class DirectProductBuilder {
  private newStateList: State[] = [];
  private newTransitions = new TransitionMap();
  private table: Map<State, [State, State]> = new Map();

  constructor(private sccGraph: StronglyConnectedComponentGraph) {}

  build(): DirectProductGraph {
    for (const ls of this.sccGraph.stateList) {
      for (const rs of this.sccGraph.stateList) {
        const newState = State.fromPair([ls, rs]);
        this.newStateList.push(newState);
        this.table.set(newState, [ls, rs]);
      }
    }

    for (const lq of this.sccGraph.stateList) {
      for (const rq of this.sccGraph.stateList) {
        for (const char of this.sccGraph.alphabet) {
          for (const ld of this.sccGraph.transitions.get(lq, char)) {
            for (const rd of this.sccGraph.transitions.get(rq, char)) {
              const source = State.fromPair([lq, rq]);

              const dest = State.fromPair([ld, rd]);

              // 2重辺も許容する
              this.newTransitions.add(source, char, dest);
            }
          }
        }
      }
    }

    return {
      type: 'DirectProductGraph',
      stateList: this.newStateList,
      alphabet: this.sccGraph.alphabet,
      transitions: this.newTransitions,
      table: this.table,
    };
  }
}
