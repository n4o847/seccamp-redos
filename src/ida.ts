import { buildStronglyConnectedComponents } from './scc';
import { NonEpsilonNFA, TripleDirectProductGraph, Message } from './types';
import { Attacker } from './attack';

export function showMessageIDA(
  nfa: NonEpsilonNFA,
  tdps: TripleDirectProductGraph[],
): Message {
  const attacker = new Attacker(nfa);

  for (const tdp of tdps) {
    const sccs = buildStronglyConnectedComponents(tdp);
    for (const scc of sccs) {
      const attack = attacker.findPolynomialAttack(scc, tdp.table);
      if (attack !== null) {
        return { status: 'Vulnerable', message: 'Detected IDA.', attack };
      }
    }
  }

  return { status: 'Safe', message: "Don't have IDA." };
}
