import { CharSet } from 'rerejs';
import {
  DirectProductNFA,
  State,
  NonNullableTransition,
  StronglyConnectedComponentNFA,
} from './types';
import { enumerateCharset } from './char';
import { intersect } from './util';

export function buildDirectProductNFAs(
  sccs: StronglyConnectedComponentNFA[],
): DirectProductNFA[] {
  return sccs.map((scc) => buildDirectProductNFA(scc));
}

export function buildDirectProductNFA(
  sccNFA: StronglyConnectedComponentNFA,
): DirectProductNFA {
  return new DirectProducer(sccNFA).build();
}

export function getLeftString(state: State): string {
  return state.id.split('_')[0];
}

export function getRightString(state: State): string {
  return state.id.split('_')[1];
}

class DirectProducer {
  private newStateList: State[] = [];
  private newTransitions: Map<State, NonNullableTransition[]> = new Map();
  private newStateToOldStateSet: Map<State, [State, State]> = new Map();

  constructor(private sccNFA: StronglyConnectedComponentNFA) {}

  build(): DirectProductNFA {
    for (const ls of this.sccNFA.stateList) {
      for (const rs of this.sccNFA.stateList) {
        this.createState(ls, rs);
      }
    }

    for (const [lq, lds] of this.sccNFA.transitions) {
      for (const ld of lds) {
        for (const [rq, rds] of this.sccNFA.transitions) {
          for (const rd of rds) {
            let source = this.getState(lq, rq);
            if (source === null) {
              source = this.createState(lq, rq);
            }

            let dest = this.getState(ld.destination, rd.destination);
            if (dest === null) {
              dest = this.createState(ld.destination, rd.destination);
            }

            // 全列挙して積集合を取る
            const le = enumerateCharset(ld.charSet);
            const re = enumerateCharset(rd.charSet);
            const lre = Array.from(intersect(le, re)).sort((a, b) => a - b);

            if (lre.length > 0) {
              const data = [];
              data.push(lre[0]);
              for (let i = 0; i < lre.length - 1; i++) {
                if (lre[i + 1] - lre[i] > 1) {
                  data.push(lre[i] + 1);
                  data.push(lre[i + 1]);
                }
              }
              data.push(lre[lre.length - 1] + 1);

              const charSet = new CharSet(data);
              this.addTransition(source, charSet, dest);
            }
          }
        }
      }
    }

    return {
      type: 'DirectProductNFA',
      stateList: this.newStateList,
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
    const state: State = {
      id: `${leftState.id}_${rightState.id}`,
    };

    this.newStateList.push(state);
    this.newTransitions.set(state, []);
    this.newStateToOldStateSet.set(state, [leftState, rightState]);
    return state;
  }

  private addTransition(
    source: State,
    charSet: CharSet,
    destination: State,
  ): void {
    // 2重辺も許容する
    this.newTransitions.get(source)!.push({ charSet, destination });
  }
}
