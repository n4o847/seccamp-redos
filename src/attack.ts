import { getLeftState, getRightState } from './directProduct';
import { State } from './state';
import { NonEpsilonNFA, Char, StronglyConnectedComponentGraph } from './types';

export function buildExponentialAttack(
  nfa: NonEpsilonNFA,
  sccs: StronglyConnectedComponentGraph[],
): string | null {
  const nullChar = getCharForNull(nfa.alphabet);

  for (const scc of sccs) {
    for (const source of scc.stateList) {
      const sourceLeft = getLeftState(source);
      const souceRight = getRightState(source);

      if (sourceLeft !== souceRight) {
        continue;
      }

      // 多重自己ループを検出
      for (const char of scc.alphabet) {
        let visited = false;
        for (const destination of scc.transitions.get(source, char)) {
          if (destination !== source) {
            continue;
          }
          if (visited) {
            let attack = '';
            attack += pathString(
              nfa,
              nfa.initialState,
              new Set([sourceLeft]),
              nullChar,
            );
            {
              const loop = char ?? nullChar;
              attack += loop.repeat(20);
            }
            attack += pathString(
              nfa,
              sourceLeft,
              nfa.acceptingStateSet,
              nullChar,
            );
            return attack;
          }
          visited = true;
        }
      }

      // (q1, q1) → (q2, q3) → (q1, q1) where q2 ≠ q3 を検出
      for (const viaPair of scc.stateList) {
        const viaLeft = getLeftState(viaPair);
        const viaRight = getRightState(viaPair);
        if (viaLeft !== viaRight && viaLeft !== sourceLeft) {
          let attack = '';
          attack += pathString(
            nfa,
            nfa.initialState,
            new Set([sourceLeft]),
            nullChar,
          );
          {
            let loop = '';
            loop += pathString(nfa, sourceLeft, new Set([viaLeft]), nullChar);
            loop += pathString(nfa, viaLeft, new Set([sourceLeft]), nullChar);
            attack += loop.repeat(20);
          }
          attack += pathString(
            nfa,
            sourceLeft,
            nfa.acceptingStateSet,
            nullChar,
          );
          return attack;
        }
      }
    }
  }

  // EDA 検出なし
  return null;
}

export function buildPolynomialAttack(): void {
  // unimplemented
}

/**
 * null に対応する文字を探す。
 */
function getCharForNull(alphabet: Set<Char>): string {
  for (let c = 0x00; ; c++) {
    const s = String.fromCharCode(c);
    if (!alphabet.has(s)) {
      return s;
    }
  }
}

/**
 * NFA 上である状態からある状態までの経路 (Char の配列) を幅優先探索で復元する。
 */
function pathString(
  nfa: NonEpsilonNFA,
  source: State,
  destinations: Set<State>,
  nullChar: string,
): string {
  /** その状態にどの状態からどの遷移でたどり着けるか */
  const referrer = new Map<State, [source: State, char: Char]>();

  const queue: State[] = [];
  queue.push(source);

  let foundDestination: State | null = null;

  while (queue.length !== 0) {
    const q = queue.shift()!;
    if (destinations.has(q)) {
      foundDestination = q;
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

  const path: string[] = [];
  if (foundDestination !== null) {
    for (let q = foundDestination; q !== source; ) {
      const [prevState, char] = referrer.get(q)!;
      path.push(char ?? nullChar);
      q = prevState;
    }
    path.reverse();
  }
  return path.join('');
}
