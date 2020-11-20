import { CharSet } from 'rerejs';
import {
  NonEpsilonNFA,
  DirectProductNFA,
  State,
  NonNullableTransition,
} from './types';
import { enumerateCharset } from './char';
import { intersect } from './util';

export function buildDirectProductNFA(nfa: NonEpsilonNFA): DirectProductNFA {
  return new DirectProducer(nfa).build();
}

class DirectProducer {
  private newStateList: State[] = [];
  private newTransitions: Map<State, NonNullableTransition[]> = new Map();
  private newStateToOldStateSet: Map<State, [State, State]> = new Map();
  private newStateId = 0;

  constructor(private nfa: NonEpsilonNFA) {}

  /**
   * 強連結成分を持つ部分グラフを受け取る
   * 初期状態は存在しない(transitionsとstateListのみでいいのか)
   */
  build(): DirectProductNFA {
    // 全てのstateを一度作る(直積)
    // もとのtransitionsから辺を張る

    for (const ls of this.nfa.stateList) {
      for (const rs of this.nfa.stateList) {
        this.createState([ls, rs]);
      }
    }
    const initialState = this.getState(
      this.nfa.initialState,
      this.nfa.initialState,
    )!;

    for (const [lq, lds] of this.nfa.transitions) {
      for (const ld of lds) {
        for (const [rq, rds] of this.nfa.transitions) {
          for (const rd of rds) {
            // arrayをキーにすると参照で検索してしまう
            let source = this.getState(lq, rq);
            if (source === null) {
              source = this.createState([lq, rq]);
            }

            let dest = this.getState(ld.destination, rd.destination);
            if (dest === null) {
              dest = this.createState([ld.destination, rd.destination]);
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
      alphabet: this.nfa.alphabet,
      stateList: this.newStateList,
      initialState: initialState,
      acceptingStateSet: new Set([initialState]),
      transitions: this.newTransitions,
    };
  }

  getState(leftState: State, rightState: State): State | null {
    for (const [ns, os] of this.newStateToOldStateSet) {
      if (os[0] === leftState && os[1] == rightState) {
        return ns;
      }
    }
    return null;
  }

  createState(oldStateTuple: [State, State]): State {
    /*
    const state: State = {
      id: `dp${this.newStateId++}`,
    };
    */
    const state: State = {
      id: `${oldStateTuple[0].id}${oldStateTuple[1].id}`,
    };

    this.newStateList.push(state);
    this.newTransitions.set(state, []);
    this.newStateToOldStateSet.set(state, oldStateTuple);
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
