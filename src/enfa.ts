import { Pattern, Node } from 'rerejs';
import { EpsilonNFA, State, NullableTransition, Char, Atom } from './types';
import { extendAlphabet, getChars } from './char';

/**
 * Thompson's construction を用いて rerejs.Pattern から ε-NFA を構築する。
 */
export function buildEpsilonNFA(pattern: Pattern): EpsilonNFA {
  return new EpsilonNFABuilder(pattern).build();
}

class EpsilonNFABuilder {
  private stateList: State[] = [];
  /**
   * 文字集合の処理をする前の遷移関数。
   * extendAlphabet で構築時に現れる文字を集めておいて、
   * 最後に getChars でノードから文字の集合を得る。
   */
  private transitions: [State, Atom | null, State][] = [];
  private stateId = 0;
  private alphabet: Set<Char> = new Set();

  constructor(private pattern: Pattern) {}

  build(): EpsilonNFA {
    const { initialState, acceptingState } = this.buildChild(
      this.pattern.child,
    );
    const transitions = new Map<State, NullableTransition[]>(
      this.stateList.map((q) => [q, []]),
    );
    for (const [source, node, destination] of this.transitions) {
      if (node === null) {
        transitions.get(source)!.push({ epsilon: true, destination });
      } else {
        for (const char of this.getChars(node)) {
          transitions.get(source)!.push({ epsilon: false, char, destination });
        }
      }
    }

    return {
      type: 'EpsilonNFA',
      alphabet: this.alphabet,
      stateList: this.stateList,
      initialState,
      acceptingState,
      transitions,
    };
  }

  /**
   * 以下の条件を満たす標準オートマトンを構成する。
   * - ただひとつの初期状態 q とただひとつの受理状態 f を持ち、q と f は異なる。
   * - 初期状態 q への遷移は持たない。
   * - 受理状態 f からの遷移は持たない。
   */
  private buildChild(
    node: Node,
  ): Pick<EpsilonNFA, 'initialState' | 'acceptingState'> {
    switch (node.type) {
      case 'Disjunction': {
        const q0 = this.createState();
        const childNFAs = node.children.map((child) => this.buildChild(child));
        const f0 = this.createState();
        for (const childNFA of childNFAs) {
          const q1 = childNFA.initialState;
          const f1 = childNFA.acceptingState;
          this.addTransition(q0, null, q1);
          this.addTransition(f1, null, f0);
        }
        return {
          initialState: q0,
          acceptingState: f0,
        };
      }
      case 'Sequence': {
        if (node.children.length === 0) {
          const q0 = this.createState();
          const f0 = this.createState();
          this.addTransition(q0, null, f0);
          return {
            initialState: q0,
            acceptingState: f0,
          };
        } else {
          const childNFAs = node.children.map((child) =>
            this.buildChild(child),
          );
          for (let i = 0; i < childNFAs.length - 1; i++) {
            const f1 = childNFAs[i].acceptingState;
            const q2 = childNFAs[i + 1].initialState;
            this.addTransition(f1, null, q2);
          }
          const q0 = childNFAs[0].initialState;
          const f0 = childNFAs[childNFAs.length - 1].acceptingState;
          return {
            initialState: q0,
            acceptingState: f0,
          };
        }
      }
      case 'Capture':
      case 'NamedCapture':
      case 'Group': {
        return this.buildChild(node.child);
      }
      case 'Many':
      case 'Some':
      case 'Optional': {
        const some = node.type === 'Some';
        const optional = node.type === 'Optional';
        const q0 = this.createState();
        const childNFA = this.buildChild(node.child);
        const f0 = this.createState();
        const q1 = childNFA.initialState;
        const f1 = childNFA.acceptingState;
        if (node.nonGreedy) {
          if (!some) {
            this.addTransition(q0, null, f0);
          }
          this.addTransition(q0, null, q1);
          this.addTransition(f1, null, f0);
          if (!optional) {
            this.addTransition(f1, null, q1);
          }
        } else {
          this.addTransition(q0, null, q1);
          if (!some) {
            this.addTransition(q0, null, f0);
          }
          if (!optional) {
            this.addTransition(f1, null, q1);
          }
          this.addTransition(f1, null, f0);
        }
        return {
          initialState: q0,
          acceptingState: f0,
        };
      }
      case 'Repeat':
      case 'WordBoundary':
      case 'LineBegin':
      case 'LineEnd':
      case 'LookAhead':
      case 'LookBehind': {
        throw new Error('unimplemented');
      }
      case 'Char':
      case 'EscapeClass':
      case 'Class':
      case 'Dot': {
        const q0 = this.createState();
        const f0 = this.createState();
        this.extendAlphabet(node);
        this.addTransition(q0, node, f0);
        return {
          initialState: q0,
          acceptingState: f0,
        };
      }
      case 'BackRef':
      case 'NamedBackRef': {
        throw new Error('unimplemented');
      }
    }
  }

  private createState(): State {
    const state = `q${this.stateId++}` as State;
    this.stateList.push(state);
    return state;
  }

  private extendAlphabet(node: Atom): void {
    // NOTE: 計算量が一番少ないthis.alphabetの更新方法
    extendAlphabet(this.alphabet, node, this.pattern.flagSet);
  }

  private getChars(node: Atom): Set<Char> {
    return getChars(this.alphabet, node, this.pattern.flagSet);
  }

  private addTransition(
    source: State,
    node: Atom | null,
    destination: State,
  ): void {
    this.transitions.push([source, node, destination]);
  }
}
