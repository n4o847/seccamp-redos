import {
  DirectProductGraph,
  State,
  StronglyConnectedComponentNFA,
} from './types';
import { TransitionMap } from './automaton';

export function buildDirectProductGraphs(
  sccs: StronglyConnectedComponentNFA[],
): DirectProductGraph[] {
  return sccs.map((scc) => buildDirectProductGraph(scc));
}

export function buildDirectProductGraph(
  sccNFA: StronglyConnectedComponentNFA,
): DirectProductGraph {
  return new DirectProductBuilder(sccNFA).build();
}

export function getLeftState(state: State): State {
  return state.split('_')[0] as State;
}

export function getRightState(state: State): State {
  return state.split('_')[1] as State;
}

class DirectProductBuilder {
  private newStateList: State[] = [];
  private newTransitions: TransitionMap;
  private newStateToOldStateSet: Map<State, [State, State]> = new Map();

  constructor(private sccNFA: StronglyConnectedComponentNFA) {
    this.newTransitions = new TransitionMap(sccNFA.stateList, sccNFA.alphabet);
  }

  build(): DirectProductGraph {
    for (const ls of this.sccNFA.stateList) {
      for (const rs of this.sccNFA.stateList) {
        this.createState(ls, rs);
      }
    }

    for (const lq of this.sccNFA.stateList) {
      for (const rq of this.sccNFA.stateList) {
        for (const char of this.sccNFA.alphabet) {
          for (const ld of this.sccNFA.transitions.get(lq, char)) {
            for (const rd of this.sccNFA.transitions.get(rq, char)!) {
              let source = this.getState(lq, rq);
              if (source === null) {
                source = this.createState(lq, rq);
              }

              let dest = this.getState(ld, rd);
              if (dest === null) {
                dest = this.createState(ld, rd);
              }

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
      alphabet: this.sccNFA.alphabet,
      transitions: this.newTransitions,
    };
  }

  getState(leftState: State, rightState: State): State | null {
    for (const [ns, os] of this.newStateToOldStateSet) {
      if (os[0] === leftState && os[1] === rightState) {
        return ns;
      }
    }
    return null;
  }

  // 直積は前の状態をスペース区切りに
  createState(leftState: State, rightState: State): State {
    const state = `${leftState}_${rightState}` as State;

    this.newStateList.push(state);

    this.newStateToOldStateSet.set(state, [leftState, rightState]);
    return state;
  }
}
