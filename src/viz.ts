import { CharSet } from 'rerejs';
import { Automaton } from './types';
import { MAX_CODE_POINT } from './char';

type Edge = {
  source: string;
  destination: string;
  priority: number | null;
  label: string;
};

type DOTOptions = {
  horizontal: boolean;
};

export function toDOT(
  automaton: Automaton,
  options: Partial<DOTOptions> = {},
): string {
  const ordered = (() => {
    switch (automaton.type) {
      case 'EpsilonNFA':
        return true;
      case 'NonEpsilonNFA':
        return true;
      case 'UnorderedNFA':
        return false;
      case 'DFA':
        return false;
    }
  })();
  const edges: Edge[] = [];
  for (const [q, ds] of automaton.transitions) {
    for (let i = 0; i < ds.length; i++) {
      const d = ds[i];
      edges.push({
        source: q.id,
        destination: d.destination.id,
        priority: ordered ? i + 1 : null,
        label: toLabelString(d.charSet),
      });
    }
  }
  let out = '';
  out += `digraph {\n`;
  if (options.horizontal) {
    out += `rankdir = LR;\n`;
  }
  const acceptingStateSet =
    automaton.type === 'EpsilonNFA'
      ? new Set([automaton.acceptingState])
      : automaton.acceptingStateSet;
  for (const q of automaton.stateList) {
    const shape = acceptingStateSet.has(q) ? `doublecircle` : `circle`;
    out += `    ${q.id} [shape = ${shape}];\n`;
  }
  const initialStateList =
    automaton.type === 'UnorderedNFA'
      ? Array.from(automaton.initialStateSet)
      : [automaton.initialState];
  for (let i = 0; i < initialStateList.length; i++) {
    const q = initialStateList[i];
    const priority = i + 1;
    out += `    ${q.id}_init [shape = point];\n`;
    out += `    ${q.id}_init -> ${q.id}${
      ordered ? ` [taillabel = "${priority}"]` : ``
    };\n`;
  }
  for (const e of edges) {
    out += `    ${e.source} -> ${e.destination} [${
      ordered ? `taillabel = "${e.priority}", ` : ``
    }label = ${JSON.stringify(e.label)}];\n`;
  }
  out += `}\n`;
  return out;
}

function toLabelString(charSet: CharSet | null): string {
  if (charSet === null) {
    return '&epsilon;';
  } else if (
    charSet.data[0] === 0 &&
    charSet.data[charSet.data.length - 1] === MAX_CODE_POINT
  ) {
    if (charSet.data.length === 2) {
      return '&Sigma;';
    } else {
      return charSet.clone().invert().toRegExpPattern(true);
    }
  } else {
    return charSet.toRegExpPattern();
  }
}
