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
  private extraTransitions = new TransitionMap();

  constructor(
    private sccGraph1: StronglyConnectedComponentGraph,
    private sccGraph2: StronglyConnectedComponentGraph,
    private nfa: SCCPossibleAutomaton,
  ) {}

  build(): TripleDirectProductGraph {
    // 強連結成分scc1, scc2間のTransitionsを取得する
    const betweenTransitionsSCC = new TransitionMap();

    for (const s1 of this.sccGraph1.stateList) {
      for (const char of this.nfa.alphabet) {
        for (const d of this.nfa.transitions.get(s1, char)) {
          if (this.sccGraph2.stateList.includes(d)) {
            betweenTransitionsSCC.add(s1, char, d);
          }
        }
      }
    }

    for (const s2 of this.sccGraph2.stateList) {
      for (const char of this.nfa.alphabet) {
        for (const d of this.nfa.transitions.get(s2, char)) {
          if (this.sccGraph1.stateList.includes(d)) {
            betweenTransitionsSCC.add(s2, char, d);
          }
        }
      }
    }

    // 後々のループのネストを浅くするため、2つのsccGraphの和集合を作る
    const sumOfTwoSccStateList: Set<State> = new Set();

    for (const s1 of this.sccGraph1.stateList) {
      sumOfTwoSccStateList.add(s1);
    }

    for (const s2 of this.sccGraph2.stateList) {
      sumOfTwoSccStateList.add(s2);
    }

    for (const ls of sumOfTwoSccStateList) {
      for (const cs of sumOfTwoSccStateList) {
        for (const rs of sumOfTwoSccStateList) {
          this.createState(ls, cs, rs);
        }
      }
    }

    const sumOfTwoSccTransitions = new TransitionMap();

    for (const [q, char, d] of this.sccGraph1.transitions) {
      sumOfTwoSccTransitions.add(q, char, d);
    }

    for (const [q, char, d] of this.sccGraph2.transitions) {
      sumOfTwoSccTransitions.add(q, char, d);
    }

    for (const [q, char, d] of betweenTransitionsSCC) {
      sumOfTwoSccTransitions.add(q, char, d);
    }

    const alphabet = new Set([
      ...this.sccGraph1.alphabet,
      ...this.sccGraph2.alphabet,
      ...this.nfa.alphabet,
    ]);

    for (const lq of sumOfTwoSccStateList) {
      for (const cq of sumOfTwoSccStateList) {
        for (const rq of sumOfTwoSccStateList) {
          for (const char of alphabet) {
            for (const ld of sumOfTwoSccTransitions.get(lq, char)) {
              for (const cd of sumOfTwoSccTransitions.get(lq, char)) {
                for (const rd of sumOfTwoSccTransitions.get(lq, char)) {
                  let source = this.getState(lq, cq, rq);
                  if (source === null) {
                    source = this.createState(lq, cq, rq);
                  }

                  let dest = this.getState(ld, cd, rd);
                  if (dest === null) {
                    dest = this.createState(ld, cd, rd);
                  }

                  this.newTransitions.add(source, char, dest);
                }
              }
            }
          }
        }
      }
    }

    // IDA判定のために、強連結成分間の戻る辺を追加
    for (const [s, char, d] of betweenTransitionsSCC) {
      let exs = this.getState(s, d, d);
      if (exs === null) {
        exs = this.createState(s, d, d);
      }

      let exd = this.getState(s, s, d);
      if (exd === null) {
        exd = this.createState(s, s, d);
      }

      this.newTransitions.add(exs, char, exd);

      this.extraTransitions.add(exs, char, exd);
    }

    return {
      type: 'TripleDirectProductGraph',
      stateList: this.newStateList,
      alphabet,
      transitions: this.newTransitions,
      extraTransitions: this.extraTransitions,
    };
  }

  getState(
    leftState: State,
    centerState: State,
    rightState: State,
  ): State | null {
    for (const [ns, os] of this.newStateToOldStateSet) {
      if (
        os[0] === leftState &&
        os[1] === centerState &&
        os[2] === rightState
      ) {
        return ns;
      }
    }
    return null;
  }

  // 直積は前の状態をスペース区切りに
  createState(leftState: State, centerState: State, rightState: State): State {
    const state = `${leftState}_${centerState}_${rightState}` as State;

    this.newStateList.push(state);

    this.newStateToOldStateSet.set(state, [leftState, centerState, rightState]);
    return state;
  }
}
