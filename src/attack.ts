import { getLeftState, getRightState } from './directProduct';
import {
  NonEpsilonNFA,
  StronglyConnectedComponentGraph,
  DirectProductGraph,
  State,
  Char,
} from './types';

export function buildExponentialAttack(
  nfa: NonEpsilonNFA,
  dp: DirectProductGraph,
  sccs: StronglyConnectedComponentGraph[],
): string | null {
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
            attack += pathString(nfa, nfa.initialState, new Set([sourceLeft]));
            if (char !== null) {
              attack += char.repeat(20);
            } else {
              // TODO: その他の文字の場合
            }
            attack += pathString(nfa, sourceLeft, nfa.acceptingStateSet);
            return attack;
          }
          visited = true;
        }
      }

      // (n, n) → (m, k) → (n, n) (m ≠ k) を検出
      for (const viaPair of scc.stateList) {
        const viaLeft = getLeftState(viaPair);
        const viaRight = getRightState(viaPair);
        if (viaLeft !== viaRight) {
          let attack = '';
          attack += pathString(nfa, nfa.initialState, new Set([sourceLeft]));
          {
            let loop = '';
            loop += pathString(nfa, sourceLeft, new Set([viaLeft]));
            loop += pathString(nfa, viaLeft, new Set([sourceLeft]));
            attack += loop.repeat(20);
          }
          attack += pathString(nfa, sourceLeft, nfa.acceptingStateSet);
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

function pathString(
  nfa: NonEpsilonNFA,
  source: State,
  destinations: Set<State>,
): string {
  // TODO: その他の文字の場合
  return restorePath(nfa, source, destinations).join('');
}

/**
 * NFA 上である状態からある状態までの経路 (Char の配列) を幅優先探索で復元する。
 */
function restorePath(
  nfa: NonEpsilonNFA,
  source: State,
  destinations: Set<State>,
): Char[] {
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

  const path: Char[] = [];
  if (foundDestination !== null) {
    for (let q = foundDestination; q !== source; ) {
      const [prevState, char] = referrer.get(q)!;
      path.push(char);
      q = prevState;
    }
    path.reverse();
  }
  return path;
}
