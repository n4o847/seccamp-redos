import * as rerejs from 'rerejs';
import {
  NFA,
} from './types';

export function toDOT(nfa: NFA): string {
  type Edge = {
    source: string;
    destination: string;
    priority: number;
    label: string;
  };

  const edges: Edge[] = [];
  for (const [q, ds] of nfa.transitions) {
    for (let i = 0; i < ds.length; i++) {
      const d = ds[i];
      edges.push({
        source: q.id,
        destination: d.destination.id,
        priority: i + 1,
        label: d.char === null ? 'ε' :
               d.char.type === 'Dot' ? 'Σ' :
               rerejs.nodeToString(d.char),
      });
    }
  }
  let out = '';
  out += `digraph G {\n`;
  const acceptingStateSet = nfa.type === 'EpsilonNFA' ? new Set([nfa.acceptingState]) : nfa.acceptingStateSet;
  for (const q of nfa.stateList) {
    const shape = acceptingStateSet.has(q) ? `doublecircle` : `circle`;
    out += `    ${q.id} [shape = ${shape}];\n`;
  }
  const initialStateList = [nfa.initialState];
  for (let i = 0; i < initialStateList.length; i++) {
    const q = initialStateList[i];
    const priority = i + 1;
    out += `    ${q.id}_init [shape = point];\n`;
    out += `    ${q.id}_init -> ${q.id} [taillabel = "${priority}"];\n`;
  }
  for (const e of edges) {
    out += `    ${e.source} -> ${e.destination} [taillabel = "${e.priority}", label = ${JSON.stringify(e.label)}];\n`;
  }
  out += `}\n`;
  return out;
}
