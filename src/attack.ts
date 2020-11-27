import { getLeftState, getRightState } from './directProduct';
import { State } from './state';
import { NonEpsilonNFA, Char, StronglyConnectedComponentGraph } from './types';

export class Attacker {
  private nfa: NonEpsilonNFA;
  private nullChar: string;

  constructor(nfa: NonEpsilonNFA) {
    this.nfa = nfa;
    this.nullChar = this.getCharForNull();
  }

  /**
   * EDA 構造を見つけ、それに対する攻撃文字列を生成する。
   */
  findExponentialAttack(scc: StronglyConnectedComponentGraph): string | null {
    for (const source of scc.stateList) {
      const sourceLeft = getLeftState(source);
      const souceRight = getRightState(source);

      if (sourceLeft !== souceRight) {
        continue;
      }

      // 多重自己ループを検出
      for (const char of scc.alphabet) {
        const selfLoops = scc.transitions
          .get(source, char)
          .filter((q) => q === source);

        if (selfLoops.length >= 2) {
          let attack = '';
          attack += this.pathString(this.nfa.initialState, sourceLeft);
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
        const viaLeft = getLeftState(viaPair);
        const viaRight = getRightState(viaPair);
        if (viaLeft !== viaRight && viaLeft !== sourceLeft) {
          let attack = '';
          attack += this.pathString(this.nfa.initialState, sourceLeft);
          {
            let loop = '';
            loop += this.pathString(sourceLeft, viaLeft);
            loop += this.pathString(viaLeft, sourceLeft);
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
  findPolynomialAttack(scc: StronglyConnectedComponentGraph): string | null {
    // (lq, lq, rq) と (lq, rq, rq) が存在するか
    for (const [lq, cq, rq] of scc.stateList.map((s) => s.split('_'))) {
      if (lq === cq && scc.stateList.includes(`${lq}_${rq}_${rq}` as State)) {
        let attack = '';
        attack += this.pathString(this.nfa.initialState, lq as State);
        {
          const loop = this.pathString(lq as State, rq as State);
          attack += loop.repeat(20);
        }
        attack += this.getSuffix(rq as State);
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
      if (!this.nfa.alphabet.has(s)) {
        return s;
      }
    }
  }

  /**
   * ある状態からある状態まで遷移する文字列を探す。
   */
  private pathString(source: State, destination: State): string {
    return findPath(this.nfa, source, destination)
      .map((char) => char || this.nullChar)
      .join('');
  }

  /**
   * (TODO)
   * EDA/IDA 構造からバックトラックの起こるような状態へ遷移する⽂字列を探す。
   */
  private getSuffix(source: State): string {
    for (const char of [...this.nfa.alphabet, null]) {
      if (this.nfa.transitions.get(source, char).length === 0) {
        return char ?? this.nullChar;
      }
    }
    return '';
  }
}

/**
 * NFA 上である状態からある状態までの経路 (Char の配列) を幅優先探索で復元する。
 */
function findPath(
  nfa: NonEpsilonNFA,
  source: State,
  destination: State,
): Char[] {
  /** その状態にどの状態からどの遷移でたどり着けるか */
  const referrer = new Map<State, [source: State, char: Char]>();

  const queue: State[] = [];
  queue.push(source);

  while (queue.length !== 0) {
    const q = queue.shift()!;
    if (q === destination) {
      break;
    }
    for (const char of nfa.alphabet) {
      for (const d of nfa.transitions.get(q, char)) {
        if (referrer.has(d)) {
          continue;
        }
        referrer.set(d, [q, char]);
        queue.push(d);
      }
    }
  }

  const path: Char[] = [];

  for (let q = destination; q !== source; ) {
    const [prevState, char] = referrer.get(q)!;
    path.push(char);
    q = prevState;
  }
  path.reverse();

  return path;
}
