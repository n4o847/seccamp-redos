import { Parser } from 'rerejs';
import { buildDirectProductGraphs } from './directProduct';
import { showMessageEDA } from './eda';
import { buildTripleDirectProductGraphs } from './tripleDirectProduct';
import { showMessageIDA } from './ida';
import { buildEpsilonNFA, eliminateEpsilonTransitions } from './lib';
import { buildStronglyConnectedComponents } from './scc';
import { Message } from './types';

export function detectReDoS(src: string, flags?: string): Message {
  try {
    const pat = new Parser(src, flags).parse();
    const enfa = buildEpsilonNFA(pat);
    const nfa = eliminateEpsilonTransitions(enfa);
    const sccs = buildStronglyConnectedComponents(nfa);
    const dps = buildDirectProductGraphs(sccs);
    const messageEDA = showMessageEDA(dps);
    if (messageEDA.status === 'Vulnerable') {
      return messageEDA;
    }
    const tdps = buildTripleDirectProductGraphs(sccs, nfa);
    const messageIDA = showMessageIDA(tdps);
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
