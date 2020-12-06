import { Pattern, Node } from 'rerejs';
import { State } from './state';
import { EpsilonNFA, NullableTransition, Char, Atom } from './types';
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
    let { initialState, acceptingState } = this.buildChild(this.pattern.child);

    // submatch用の処理
    if (
      this.pattern.child.type === 'Capture' ||
      this.pattern.child.type === 'NamedCapture' ||
      this.pattern.child.type === 'Group'
    ) {
      [initialState, acceptingState] = this.buildSubMatch(
        this.pattern.child.child,
        initialState,
        acceptingState,
      );
    } else {
      [initialState, acceptingState] = this.buildSubMatch(
        this.pattern.child,
        initialState,
        acceptingState,
      );
    }

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

    // DFA構築時非受理状態作成のために必要
    this.alphabet.add(null);

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
        const childNFAs = node.children
          .filter(
            (child) => child.type !== 'LineBegin' && child.type !== 'LineEnd',
          )
          .map((child) => this.buildChild(child));
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
          // ^または$が有効的な場所にない場合、エラーを返す
          node.children.forEach((child, index) => {
            if (index > 0 && child.type === 'LineBegin') {
              throw new Error('Illigal use LineBegin');
            }
            if (index < node.children.length - 1 && child.type === 'LineEnd') {
              throw new Error('Illigal use LineEnd');
            }
          });
          const childNFAs = node.children
            .filter(
              (child) => child.type !== 'LineBegin' && child.type !== 'LineEnd',
            )
            .map((child) => this.buildChild(child));
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
      case 'LineBegin':
      case 'LineEnd': {
        const q0 = this.throughState();
        return {
          initialState: q0,
          acceptingState: q0,
        };
      }
    }
  }

  private buildSubMatch(
    pattern: Node,
    initialState: State,
    acceptingState: State,
  ): [initialState: State, acceptingState: State] {
    if (pattern.type === 'Disjunction') {
      // 始端submatch (非貪欲)
      const oldInitialTransitions = this.transitions.filter(
        (t) => t[0] === initialState,
      );
      oldInitialTransitions.forEach(([source, node, dest], index) => {
        const patChild: Node = pattern.children[index];
        if (
          (patChild.type === 'Sequence' &&
            patChild.children.length > 0 &&
            patChild.children[0].type !== 'LineBegin') ||
          (patChild.type === 'Sequence' && patChild.children.length === 0) ||
          (patChild.type !== 'Sequence' && patChild.type !== 'LineBegin')
        ) {
          // 元の遷移を削除
          this.transitions = this.transitions.filter(
            ([s, n, d]) => s !== source || n !== node || d !== dest,
          );
          // 遷移を追加
          const q0 = this.createState();
          const f0 = this.createState();
          const q1 = this.createState();
          const f1 = this.createState();
          this.addTransition(initialState, null, q0);
          this.addTransition(q0, null, f0); // 非貪欲
          this.addTransition(f0, null, dest);
          this.addTransition(q0, null, q1);
          this.addTransition(f1, null, f0);
          this.addDotTransition(q1, f1);
          this.addTransition(f1, null, q1);
        }
      });
      // 終端submatch (貪欲)
      const oldFinalTransitions = this.transitions.filter(
        (t) => t[2] === acceptingState,
      );
      oldFinalTransitions.forEach(([source, node, dest], index) => {
        const patChild: Node = pattern.children[index];
        if (
          (patChild.type === 'Sequence' &&
            patChild.children.length > 0 &&
            patChild.children[patChild.children.length - 1].type !==
              'LineEnd') ||
          (patChild.type === 'Sequence' && patChild.children.length === 0) ||
          (patChild.type !== 'Sequence' && patChild.type !== 'LineEnd')
        ) {
          // 遷移を削除
          this.transitions = this.transitions.filter(
            ([s, n, d]) => s !== source || n !== node || d !== dest,
          );
          // 遷移を追加
          const q0 = this.createState();
          const f0 = this.createState();
          const q1 = this.createState();
          const f1 = this.createState();
          this.addTransition(q0, null, q1); // 貪欲
          this.addDotTransition(q1, f1);
          this.addTransition(f1, null, q1);
          this.addTransition(f1, null, f0);
          this.addTransition(source, null, q0);
          this.addTransition(q0, null, f0);
          this.addTransition(f0, null, acceptingState);
        }
      });
    } else {
      // 始端submatch (非貪欲)
      if (
        pattern.type !== 'Sequence' ||
        pattern.children.length === 0 ||
        (pattern.children.length > 0 &&
          pattern.children[0].type !== 'LineBegin')
      ) {
        // 初期状態を変えて、遷移を付け足す
        const q0 = this.createState();
        const f0 = this.createState();
        const q1 = this.createState();
        const f1 = this.createState();
        this.addTransition(q0, null, f0); // 非貪欲
        this.addTransition(f0, null, initialState);
        this.addTransition(q0, null, q1);
        this.addTransition(f1, null, f0);
        this.addDotTransition(q1, f1);
        this.addTransition(f1, null, q1);

        initialState = q0;
      }

      // 終端submatch (貪欲)
      if (
        pattern.type !== 'Sequence' ||
        pattern.children.length === 0 ||
        (pattern.children.length > 0 &&
          pattern.children[pattern.children.length - 1].type !== 'LineEnd')
      ) {
        const q0 = this.createState();
        const f0 = this.createState();
        const q1 = this.createState();
        const f1 = this.createState();
        this.addTransition(q0, null, q1); // 貪欲
        this.addDotTransition(q1, f1);
        this.addTransition(f1, null, q1);
        this.addTransition(f1, null, f0);
        this.addTransition(acceptingState, null, q0);
        this.addTransition(q0, null, f0);

        acceptingState = f0;
      }
    }
    return [initialState, acceptingState];
  }

  private throughState(): State {
    const state = `q${this.stateId}` as State;
    return state;
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

  private addDotTransition(source: State, destination: State): void {
    // 適当なDotのnode
    const node: Node = {
      type: 'Dot',
      range: [0, 0],
    };
    this.extendAlphabet(node);
    this.addTransition(source, node, destination);
  }
}
