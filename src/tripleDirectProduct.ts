import {
  TripleDirectProductGraph,
  StronglyConnectedComponentGraph,
  SCCPossibleAutomaton,
  State,
} from './types';
import { TransitionMap } from './automaton';

export function buildTripleDirectProductGraphs(
  sccs: StronglyConnectedComponentGraph[],
  nfa: SCCPossibleAutomaton,
): TripleDirectProductGraph[] {
  return sccs
    .map((scc1, _, sccs) =>
      sccs
        .filter((scc2) => scc1 !== scc2)
        .map((scc2) => buildTripleDirectProductGraph(scc1, scc2, nfa)),
    )
    .flat(1);
}

export function buildTripleDirectProductGraph(
  sccGraph1: StronglyConnectedComponentGraph,
  sccGraph2: StronglyConnectedComponentGraph,
  nfa: SCCPossibleAutomaton,
): TripleDirectProductGraph {
  return new TripleDirectProductBuilder(sccGraph1, sccGraph2, nfa).build();
}

class TripleDirectProductBuilder {
  private newStateList: State[] = [];
  private newTransitions = new TransitionMap();
  private newStateToOldStateSet: Map<State, [State, State, State]> = new Map();

  constructor(
    private sccGraph1: StronglyConnectedComponentGraph,
    private sccGraph2: StronglyConnectedComponentGraph,
    private nfa: SCCPossibleAutomaton,
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
    };
  }

  // 直積は前の状態をスペース区切りに
  createState(leftState: State, centerState: State, rightState: State): State {
    for (const [ns, os] of this.newStateToOldStateSet) {
      if (
        os[0] === leftState &&
        os[1] === centerState &&
        os[2] === rightState
      ) {
        return ns;
      }
    }

    const state = `${leftState}_${centerState}_${rightState}` as State;
    this.newStateList.push(state);
    this.newStateToOldStateSet.set(state, [leftState, centerState, rightState]);
    return state;
  }
}
