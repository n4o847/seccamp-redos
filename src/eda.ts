import { buildStronglyConnectedComponents } from './scc';
import { NonEpsilonNFA, DirectProductGraph, Message } from './types';
import { Attacker } from './attack';

/**
 * 強連結成分を一つ一つ見ていき、EDAを持つかメッセージを返す
 */
export function showMessageEDA(
  nfa: NonEpsilonNFA,
  dps: DirectProductGraph[],
): Message {
  const attacker = new Attacker(nfa);

  for (const dp of dps) {
    const sccs = buildStronglyConnectedComponents(dp);
    for (const scc of sccs) {
      const attack = attacker.findExponentialAttack(scc);
      if (attack !== null) {
        return { status: 'Vulnerable', message: 'Detected EDA.', attack };
      }
    }
  }

  return { status: 'Safe', message: "Don't have EDA." };
}
