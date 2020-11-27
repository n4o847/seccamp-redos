import { Parser } from 'rerejs';
import { buildDirectProductGraphs } from './directProduct';
import { showMessageEDA } from './eda';
import { buildEpsilonNFA, eliminateEpsilonTransitions } from './lib';
import { buildStronglyConnectedComponents } from './scc';
import { Message } from './types';

export function detectEDA(src: string, flags?: string): Message {
  try {
    const pat = new Parser(src, flags).parse();
    const enfa = buildEpsilonNFA(pat);
    const nfa = eliminateEpsilonTransitions(enfa);
    const sccs = buildStronglyConnectedComponents(nfa);
    const dps = buildDirectProductGraphs(sccs);
    return showMessageEDA(nfa, dps);
  } catch (e) {
    if (e instanceof Error) {
      return { status: 'Error', message: e.message };
    } else {
      return { status: 'Error', message: 'Undefined Error.' };
    }
  }
}
