import {
  NonEpsilonNFA,
  NonNullableTransition,
  State,
  StronglyConnectedComponentNFA,
} from './types';

export function buildStronglyConnectedComponents(
  nfa: NonEpsilonNFA,
): StronglyConnectedComponentNFA[] {
  return new StronglyConnectedComponents(nfa).build();
}

class StronglyConnectedComponents {
  private reverseTransitions: Map<State, NonNullableTransition[]> = new Map();
  private used: Map<State, boolean> = new Map();
  private order: State[] = [];
  private comp: Map<State, number> = new Map();
  private sccList: StronglyConnectedComponentNFA[] = [];

  constructor(private nfa: NonEpsilonNFA) {}

  build(): StronglyConnectedComponentNFA[] {
    this.nfa.stateList.forEach((state) => {
      this.used.set(state, false);
      this.comp.set(state, -1);
      this.reverseTransitions.set(state, []);
    });

    for (const [q, ds] of this.nfa.transitions) {
      for (const d of ds) {
        this.reverseTransitions
          .get(d.destination)!
          .push({ charSet: d.charSet, destination: q });
      }
    }

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
        for (const tr of this.nfa.transitions.get(state)!) {
          if (this.comp.get(state) === this.comp.get(tr.destination)) {
            sccNFA.transitions.get(state)!.push(tr);
          }
        }
      }
    }

    // Logger(後で消す)
    /*
    for (const scc of this.sccList) {
      console.log(scc);
      for (const [s, dd] of scc.transitions) {
        console.log(s);
        for (const d of dd) {
          console.log(s, d.destination, d.charSet);
        }
      }
    }
    */

    return this.sccList;
  }

  private dfs(state: State): void {
    if (this.used.get(state)!) return;
    this.used.set(state, true);
    for (const tr of this.nfa.transitions.get(state)!) {
      this.dfs(tr.destination);
    }
    this.order.push(state);
  }

  private rdfs(state: State, cnt: number): void {
    if (this.comp.get(state)! !== -1) return;

    this.comp.set(state, cnt);

    if (cnt === this.sccList.length) {
      this.sccList.push({
        type: 'StronglyConnectedComponentNFA',
        stateList: [],
        transitions: new Map(),
      });
    }

    const sccNFA = this.sccList[cnt];
    sccNFA.stateList.push(state);
    sccNFA.transitions.set(state, []);

    // 同じ強連結成分同士の集合を作る
    for (const rt of this.reverseTransitions.get(state)!) {
      this.rdfs(rt.destination, cnt);
    }
  }
}
