import { Parser } from 'rerejs';
import { buildDirectProductNFAs } from './directProduct';
import { hasEDA } from './eda';
import { buildEpsilonNFA, eliminateEpsilonTransitions } from './lib';
import { buildStronglyConnectedComponents } from './scc';

export function detectEDA(src: string, flags?: string): flag {
  const pat = new Parser(src, flags).parse();
  const enfa = buildEpsilonNFA(pat);
  const nfa = eliminateEpsilonTransitions(enfa);
  const sccs = buildStronglyConnectedComponents(nfa);
  const dps = buildDirectProductNFAs(sccs);

  return hasEDA(dps);
}
