import { State } from './state';
import { Char, DFA, PrunedNFA, StronglyConnectedComponentGraph } from './types';

export class Attacker {
  private pnfa: PrunedNFA;
  private dfa: DFA;
  private nullChar: string;

  constructor(pnfa: PrunedNFA, dfa: DFA) {
    this.pnfa = pnfa;
    this.dfa = dfa;
    this.nullChar = this.getCharForNull();
  }

  /**
   * EDA 構造を見つけ、それに対する攻撃文字列を生成する。
   */
  findExponentialAttack(
    scc: StronglyConnectedComponentGraph,
    table: Map<State, [State, State]>,
  ): string | null {
    for (const source of scc.stateList) {
      const [sourceLeft, sourceRight] = table.get(source)!;

      if (sourceLeft !== sourceRight) {
        continue;
      }

      // 多重自己ループを検出
      for (const char of scc.alphabet) {
        const selfLoops = scc.transitions
          .get(source, char)
          .filter((q) => q === source);

        if (selfLoops.length >= 2) {
          let attack = '';
          attack += this.getPathString(this.pnfa.initialStateSet, sourceLeft);
          {
            const loop = char ?? this.nullChar;
            attack += loop.repeat(20);
          }
          attack += this.getSuffix(sourceLeft);
          return attack;
        }
      }

      // (q1, q1) → (q2, q3) → (q1, q1) where q2 ≠ q3 を検出
      for (const viaPair of scc.stateList) {
        const [viaLeft, viaRight] = table.get(viaPair)!;

        if (viaLeft !== viaRight && viaLeft !== sourceLeft) {
          let attack = '';
          attack += this.getPathString(this.pnfa.initialStateSet, sourceLeft);
          {
            let loop = '';
            loop += this.getPathString(sourceLeft, viaLeft);
            loop += this.getPathString(viaLeft, sourceLeft);
            attack += loop.repeat(20);
          }
          attack += this.getSuffix(sourceLeft);
          return attack;
        }
      }
    }

    // EDA 検出なし
    return null;
  }

  /**
   * IDA 構造を見つけ、それに対する攻撃文字列を生成する。
   */
  findPolynomialAttack(
    scc: StronglyConnectedComponentGraph,
    table: Map<State, [State, State, State]>,
  ): string | null {
    // (lq, lq, rq) と (lq, rq, rq) が存在するか
    for (const [lq, cq, rq] of scc.stateList.map((s) => table.get(s)!)) {
      if (lq === cq && scc.stateList.includes(State.fromTriple([lq, rq, rq]))) {
        let attack = '';
        attack += this.getPathString(this.pnfa.initialStateSet, lq);
        {
          const loop = this.getPathString(lq, rq);
          attack += loop.repeat(20);
        }
        attack += this.getSuffix(rq);
        return attack;
      }
    }

    // IDA 検出なし
    return null;
  }

  /**
   * null に対応する文字を探す。
   */
  private getCharForNull(): string {
    for (let c = 0x00; ; c++) {
      const s = String.fromCharCode(c);
      if (!this.pnfa.alphabet.has(s)) {
        return s;
      }
    }
  }

  /**
   * ある状態からある状態まで遷移する文字列を探す。
   */
  private getPathString(
    source: State | Set<State>,
    destination: State,
  ): string {
    return findPath(this.pnfa, source, destination)
      .map((char) => char ?? this.nullChar)
      .join('');
  }

  /**
   * EDA/IDA 構造からバックトラックの起こるような状態へ遷移する⽂字列を探す。
   */
  private getSuffix(source: State): string {
    return findPath(
      this.dfa,
      this.dfa.initialState,
      this.pnfa.table.get(source)![1],
    )
      .map((char) => char ?? this.nullChar)
      .reverse()
      .join('');
  }
}

/**
 * NFA 上である状態からある状態までの経路 (Char の配列) を幅優先探索する。
 */
function findPath(
  pnfa: PrunedNFA | DFA,
  source: State | Set<State>,
  destination: State,
): Char[] {
  /** その状態にどの状態からどの遷移でたどり着けるか */
  const referrer = new Map<State, [source: State, char: Char]>();

  const queue: State[] = [];

  const initialStateSet = new Set(source instanceof Set ? source : [source]);

  queue.push(...initialStateSet);

  while (queue.length !== 0) {
    const q = queue.shift()!;
    if (q === destination) {
      break;
    }
    for (const char of pnfa.alphabet) {
      for (const d of pnfa.transitions.get(q, char)) {
        if (referrer.has(d)) {
          continue;
        }
        referrer.set(d, [q, char]);
        queue.push(d);
      }
    }
  }

  const path: Char[] = [];

  for (let q = destination; !initialStateSet.has(q); ) {
    const [prevState, char] = referrer.get(q)!;
    path.push(char);
    q = prevState;
  }
  path.reverse();

  return path;
}
