import {
  Automaton,
} from './types';
import { MAX_CODE_POINT } from './char';

type Edge = {
  source: string;
  destination: string;
  priority: number | null;
  label: string;
};

export function toDOT(automaton: Automaton): string {
  const ordered = (() => {
    switch (automaton.type) {
      case 'EpsilonNFA': return true;
      case 'NonEpsilonNFA': return true;
      case 'UnorderedNFA': return false;
      case 'DFA': return false;
    }
  })();
  const edges: Edge[] = [];
  for (const [q, ds] of automaton.transitions) {
    for (let i = 0; i < ds.length; i++) {
      const d = ds[i];
      let label = '';
      if (d.charSet === null) {
        label = '&epsilon;';
      } else if (d.charSet.data[0] === 0 && d.charSet.data[d.charSet.data.length - 1] === MAX_CODE_POINT) {
        if (d.charSet.data.length === 2) {
          label = '&Sigma;';
        } else {
          label = d.charSet.clone().invert().toRegExpPattern(true);
        }
      } else {
        label = d.charSet.toRegExpPattern();
      }
      edges.push({
        source: q.id,
        destination: d.destination.id,
        priority: ordered ? i + 1 : null,
        label,
      });
    }
  }
  let out = '';
  out += `digraph {\n`;
  const acceptingStateSet = automaton.type === 'EpsilonNFA' ? new Set([automaton.acceptingState]) : automaton.acceptingStateSet;
  for (const q of automaton.stateList) {
    const shape = acceptingStateSet.has(q) ? `doublecircle` : `circle`;
    out += `    ${q.id} [shape = ${shape}];\n`;
  }
  const initialStateList = automaton.type === 'UnorderedNFA' ? Array.from(automaton.initialStateSet) : [automaton.initialState];
  for (let i = 0; i < initialStateList.length; i++) {
    const q = initialStateList[i];
    const priority = i + 1;
    out += `    ${q.id}_init [shape = point];\n`;
    out += `    ${q.id}_init -> ${q.id}${ordered ? ` [taillabel = "${priority}"]` : ``};\n`;
  }
  for (const e of edges) {
    out += `    ${e.source} -> ${e.destination} [${ordered ? `taillabel = "${e.priority}", ` : ``}label = ${JSON.stringify(e.label)}];\n`;
  }
  out += `}\n`;
  return out;
}
