import { Parser } from 'rerejs';
import { buildEpsilonNFA } from './enfa';
import { eliminateEpsilonTransitions } from './nfa';
import { reverseNFA, determinize } from './dfa';
import { prune } from './pruning';
import { buildStronglyConnectedComponents } from './scc';
import { buildDirectProductGraphs } from './directProduct';
import { showMessageEDA } from './eda';
import { buildTripleDirectProductGraphs } from './tripleDirectProduct';
import { showMessageIDA } from './ida';
import { Message } from './types';

export function detectReDoS(src: string, flags?: string): Message {
  try {
    const pat = new Parser(src, flags).parse();
    const enfa = buildEpsilonNFA(pat);
    const nfa = eliminateEpsilonTransitions(enfa);
    const rnfa = reverseNFA(nfa);
    const dfa = determinize(rnfa);
    const pnfa = prune(nfa, dfa);
    const sccs = buildStronglyConnectedComponents(pnfa);
    const dps = buildDirectProductGraphs(sccs);
    const messageEDA = showMessageEDA(pnfa, dfa, dps);
    if (messageEDA.status === 'Vulnerable') {
      return messageEDA;
    }
    const tdps = buildTripleDirectProductGraphs(sccs, pnfa);
    const messageIDA = showMessageIDA(pnfa, dfa, tdps);
    if (messageIDA.status === 'Vulnerable') {
      return messageIDA;
    }
    return {
      status: 'Safe',
      message: "Don't have EDA nor IDA",
    } as Message;
  } catch (e) {
    if (e instanceof Error) {
      return { status: 'Error', message: e.message };
    } else {
      return { status: 'Error', message: 'Undefined Error.' };
    }
  }
}
