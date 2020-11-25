import {
  TripleDirectProductGraph,
  StronglyConnectedComponentNFA,
  SCCPossibleAutomaton,
  State,
  Char,
} from './types';
import { TransitionMap } from './automaton';

export function buildTripleDirectProductGraphs(
  sccs: StronglyConnectedComponentNFA[],
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
  sccNFA1: StronglyConnectedComponentNFA,
  sccNFA2: StronglyConnectedComponentNFA,
  nfa: SCCPossibleAutomaton,
): TripleDirectProductGraph {
  return new TripleDirectProductBuilder(sccNFA1, sccNFA2, nfa).build();
}

class TripleDirectProductBuilder {
  private newStateList: State[] = [];
  private newTransitions = new TransitionMap();
  private newStateToOldStateSet: Map<State, [State, State, State]> = new Map();
  private extraTransitions = new TransitionMap();

  constructor(
    private sccNFA1: StronglyConnectedComponentNFA,
    private sccNFA2: StronglyConnectedComponentNFA,
    private nfa: SCCPossibleAutomaton,
  ) {}

  build(): TripleDirectProductGraph {
    // 強連結成分scc1, scc2間のTransitionsを取得する
    const betweenTransitionsSCC = new TransitionMap();

    for (const s1 of this.sccNFA1.stateList) {
      for (const s1t of this.nfa.transitions.get(s1)!) {
        if (this.sccNFA2.stateList.includes(s1t.destination)) {
          if (betweenTransitionsSCC.get(s1)! === undefined) {
            betweenTransitionsSCC.set(s1, []);
          }
          betweenTransitionsSCC.get(s1)!.push(s1t);
        }
      }
    }

    for (const s2 of this.sccNFA2.stateList) {
      for (const s2t of this.sccNFA2.transitions.get(s2)!) {
        if (this.sccNFA1.stateList.includes(s2t.destination)) {
          if (betweenTransitionsSCC.get(s2)! === undefined) {
            betweenTransitionsSCC.set(s2, []);
          }
          betweenTransitionsSCC.get(s2)!.push(s2t);
        }
      }
    }

    // 後々のループのネストを浅くするため、2つのsccNFAの和集合を作る
    const sumOfTwoSccStateList: Set<State> = new Set();

    for (const s1 of this.sccNFA1.stateList) {
      sumOfTwoSccStateList.add(s1);
    }

    for (const s2 of this.sccNFA2.stateList) {
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

    for (const [q, char, d] of this.sccNFA1.transitions) {
      sumOfTwoSccTransitions.add(q, char, d);
    }

    for (const [q, char, d] of this.sccNFA2.transitions) {
      sumOfTwoSccTransitions.add(q, char, d);
    }

    for (const [q, char, d] of betweenTransitionsSCC) {
      sumOfTwoSccTransitions.add(q, char, d);
    }

    const alphabet = new Set([
      ...this.sccNFA1.alphabet,
      ...this.sccNFA2.alphabet,
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

                  this.addTransition(source, char, dest);
                }
              }
            }
          }
        }
      }
    }

    // IDA判定のために、強連結成分間の戻る辺を追加
    for (const [s, dests] of betweenTransitionsSCC) {
      for (const d of dests) {
        let exs = this.getState(s, d.destination, d.destination);
        if (exs === null) {
          exs = this.createState(s, d.destination, d.destination);
        }

        let exd = this.getState(s, s, d.destination);
        if (exd === null) {
          exd = this.createState(s, s, d.destination);
        }

        this.newTransitions
          .get(exs)!
          .push({ charSet: d.charSet, destination: exd });

        if (this.extraTransitions.get(exs)! === undefined) {
          this.extraTransitions.set(exs, []);
        }
        this.extraTransitions
          .get(exs)!
          .push({ charSet: d.charSet, destination: exd });
      }
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

  private addTransition(source: State, char: Char, destination: State): void {
    this.newTransitions.add(source, char, destination);
  }
}
