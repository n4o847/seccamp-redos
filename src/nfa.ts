import { State } from './state';
import { TransitionMap } from './transitions';
import { EpsilonNFA, NonEpsilonNFA, Char } from './types';

/**
 * ε-NFA から ε-遷移を除去する。
 */
export function eliminateEpsilonTransitions(nfa: EpsilonNFA): NonEpsilonNFA {
  return new EpsilonEliminatedNFABuilder(nfa).build();
}

type ClosureItem =
  | {
      accepting: true;
    }
  | {
      accepting: false;
      char: Char;
      destination: State;
    };

class EpsilonEliminatedNFABuilder {
  private newStateList: State[] = [];
  private newTransitions = new TransitionMap();

  constructor(private nfa: EpsilonNFA) {}

  build(): NonEpsilonNFA {
    const queue = [];
    const newInitialState = this.nfa.initialState;
    const newAcceptingStateSet = new Set<State>();
    this.newStateList.push(newInitialState);
    queue.push(newInitialState);
    while (queue.length !== 0) {
      const q0 = queue.shift()!;
      const closure = this.buildClosure(q0);
      for (const item of closure) {
        if (item.accepting) {
          newAcceptingStateSet.add(q0);
        } else {
          const q1 = item.destination;
          this.newTransitions.add(q0, item.char, q1);
          if (!this.newStateList.includes(q1)) {
            this.newStateList.push(q1);
            queue.push(q1);
          }
        }
      }
    }

    console.log(newInitialState);
    return {
      type: 'NonEpsilonNFA',
      stateList: this.newStateList,
      alphabet: this.nfa.alphabet,
      initialState: newInitialState,
      acceptingStateSet: newAcceptingStateSet,
      transitions: this.newTransitions,
    };
  }

  /**
   * 状態 q から ε-遷移のみをたどっていき、得られる全ての受理状態あるいは ε でない遷移を得る。
   * 別の経路で得られるものは区別する。また、経路はループを含まない。
   */
  private buildClosure(q: State, path: State[] = []): ClosureItem[] {
    if (path.includes(q)) {
      return [];
    } else if (q === this.nfa.acceptingState) {
      return [{ accepting: true }];
    } else {
      return this.nfa.transitions.get(q)!.flatMap((d) => {
        if (d.epsilon) {
          return this.buildClosure(d.destination, [...path, q]);
        } else {
          return [
            {
              accepting: false,
              char: d.char,
              destination: d.destination,
            },
          ];
        }
      });
    }
  }
}
