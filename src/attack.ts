import { NonEpsilonNFA, State, Char } from './types';

export function buildExponentialAttack(): void {
  // unimplemented
}

export function buildPolynomialAttack(): void {
  // unimplemented
}

/**
 * NFA 上である状態からある状態までの経路 (Char の配列) を幅優先探索で復元する。
 */
function restorePath(
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
