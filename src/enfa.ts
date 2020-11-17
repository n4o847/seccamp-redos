import { Pattern, Node, CharSet } from 'rerejs';
import { EpsilonNFA, State, NullableTransition } from './types';
import { createCharSet } from './char';

/**
 * Thompson's construction を用いて rerejs.Pattern から ε-NFA を構築する。
 */
export function buildEpsilonNFA(pattern: Pattern): EpsilonNFA {
  return new Builder(pattern).build();
}

class Builder {
  private stateList: State[] = [];
  private transitions: Map<State, NullableTransition[]> = new Map();
  private stateId = 0;
  /**
   * 構築時に得られた rerejs.CharSet 上の各区間の始端と終端を集める。
   * これによって Unicode 上の文字を区別するのに十分な（必要とは限らない）区間の分割を得る。
   * 文字を列挙する際は alphabet[i] <= ch < alphabet[i + 1] であるような ch を
   * 各 0 <= i < alphabet.length - 1 について列挙して charSet.has(ch) で判定すれば良い。
   */
  private partitionPoints: Set<number> = new Set();

  constructor(
    private pattern: Pattern,
  ) {}

  build(): EpsilonNFA {
    const { initialState, acceptingState } = this.buildChild(this.pattern.child);
    const alphabet = Array.from(this.partitionPoints).sort((a, b) => a - b);
    return {
      type: 'EpsilonNFA',
      alphabet,
      stateList: this.stateList,
      initialState,
      acceptingState,
      transitions: this.transitions,
    };
  }

  /**
   * 以下の条件を満たす標準オートマトンを構成する。
   * - ただひとつの初期状態 q とただひとつの受理状態 f を持ち、q と f は異なる。
   * - 初期状態 q への遷移は持たない。
   * - 受理状態 f からの遷移は持たない。
   */
  private buildChild(node: Node): Pick<EpsilonNFA, 'initialState' | 'acceptingState'> {
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
          const childNFAs = node.children.map((child) => this.buildChild(child));
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
          if (!some)     this.addTransition(q0, null, f0);
                         this.addTransition(q0, null, q1);
                         this.addTransition(f1, null, f0);
          if (!optional) this.addTransition(f1, null, q1);
        } else {
                         this.addTransition(q0, null, q1);
          if (!some)     this.addTransition(q0, null, f0);
          if (!optional) this.addTransition(f1, null, q1);
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
        const charSet = createCharSet(node, this.pattern.flagSet);
        this.addTransition(q0, charSet, f0);
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
    const state: State = {
      id: `q${this.stateId++}`,
    };
    this.stateList.push(state);
    this.transitions.set(state, []);
    return state;
  }

  private addTransition(source: State, charSet: CharSet | null, destination: State): void {
    if (charSet !== null) {
      for (const codePoint of charSet.data) {
        this.partitionPoints.add(codePoint);
      }
    }
    this.transitions.get(source)!.push({ charSet, destination });
  }
}
