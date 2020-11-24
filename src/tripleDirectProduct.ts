import { CharSet } from 'rerejs';
import { intersectCharSets } from './char';
import {
  TripleDirectProductNFA,
  SCCPossibleAutomaton,
  State,
  NonNullableTransition,
  StronglyConnectedComponentNFA,
} from './types';

export function buildTripleDirectProductNFAs(
  sccs: StronglyConnectedComponentNFA[],
  nfa: SCCPossibleAutomaton,
): TripleDirectProductNFA[] {
  return sccs
    .map((scc1, _, sccs) =>
      sccs
        .filter((scc2) => scc1 !== scc2)
        .map((scc2) => buildTripleDirectProductNFA(scc1, scc2, nfa)),
    )
    .flat(1);
}

export function buildTripleDirectProductNFA(
  sccNFA1: StronglyConnectedComponentNFA,
  sccNFA2: StronglyConnectedComponentNFA,
  nfa: SCCPossibleAutomaton,
): TripleDirectProductNFA {
  return new TripleDirectProducer(sccNFA1, sccNFA2, nfa).build();
}

class TripleDirectProducer {
  private newStateList: State[] = [];
  private newTransitions: Map<State, NonNullableTransition[]> = new Map();
  private newStateToOldStateSet: Map<State, [State, State, State]> = new Map();
  private extraTransitions: Map<State, NonNullableTransition[]> = new Map();

  constructor(
    private sccNFA1: StronglyConnectedComponentNFA,
    private sccNFA2: StronglyConnectedComponentNFA,
    private nfa: SCCPossibleAutomaton,
  ) {}

  build(): TripleDirectProductNFA {
    // 強連結成分scc1, scc2間のTransitionsを取得する
    const betweenTransitionsSCC: Map<
      State,
      NonNullableTransition[]
    > = new Map();

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

    const sumOfTwoSccTransitions: Map<
      State,
      NonNullableTransition[]
    > = new Map();

    for (const [q, ds] of this.sccNFA1.transitions) {
      for (const d of ds) {
        if (sumOfTwoSccTransitions.get(q)! === undefined) {
          sumOfTwoSccTransitions.set(q, []);
        }
        sumOfTwoSccTransitions.get(q)!.push(d);
      }
    }

    for (const [q, ds] of this.sccNFA2.transitions) {
      for (const d of ds) {
        if (sumOfTwoSccTransitions.get(q)! === undefined) {
          sumOfTwoSccTransitions.set(q, []);
        }
        sumOfTwoSccTransitions.get(q)!.push(d);
      }
    }

    for (const [q, ds] of betweenTransitionsSCC) {
      for (const d of ds) {
        if (sumOfTwoSccTransitions.get(q)! === undefined) {
          sumOfTwoSccTransitions.set(q, []);
        }
        sumOfTwoSccTransitions.get(q)!.push(d);
      }
    }

    for (const [lq, lds] of sumOfTwoSccTransitions) {
      for (const ld of lds) {
        for (const [cq, cds] of sumOfTwoSccTransitions) {
          for (const cd of cds) {
            for (const [rq, rds] of sumOfTwoSccTransitions) {
              for (const rd of rds) {
                let source = this.getState(lq, cq, rq);
                if (source === null) {
                  source = this.createState(lq, cq, rq);
                }

                let dest = this.getState(
                  ld.destination,
                  cd.destination,
                  rd.destination,
                );
                if (dest === null) {
                  dest = this.createState(
                    ld.destination,
                    cd.destination,
                    rd.destination,
                  );
                }

                const lcre = intersectCharSets(
                  ld.charSet,
                  cd.charSet,
                  rd.charSet,
                );
                this.addTransition(source, lcre, dest);
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
      type: 'TripleDirectProductNFA',
      stateList: this.newStateList,
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
    this.newTransitions.set(state, []);
    this.newStateToOldStateSet.set(state, [leftState, centerState, rightState]);
    return state;
  }

  private addTransition(
    source: State,
    charSet: CharSet,
    destination: State,
  ): void {
    this.newTransitions.get(source)!.push({ charSet, destination });
  }
}
