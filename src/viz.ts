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
      case 'PruningNFA':
        return true;
      case 'StronglyConnectedComponentGraph':
        return false;
      case 'DirectProductGraph':
        return false;
    }
  })();

  const edges: Edge[] = [];
  if (automaton.type === 'EpsilonNFA') {
    for (const [source, ds] of automaton.transitions) {
      for (let i = 0; i < ds.length; i++) {
        const d = ds[i];
        edges.push({
          source,
          destination: d.destination,
          priority: ordered ? i + 1 : null,
          // TODO: その他の文字の処理
          label: d.epsilon ? '&epsilon;' : d.char ?? '',
        });
      }
    }
  } else {
    for (const source of automaton.stateList) {
      for (const char of automaton.alphabet) {
        const destinations = automaton.transitions.get(source, char);
        for (let i = 0; i < destinations.length; i++) {
          edges.push({
            source,
            destination: destinations[i],
            priority: ordered ? i + 1 : null,
            // TODO: その他の文字の処理
            label: char ?? '',
          });
        }
      }
    }
  }

  let out = '';
  out += `digraph {\n`;
  if (options.horizontal) {
    out += `rankdir = LR;\n`;
  }

  switch (automaton.type) {
    case 'StronglyConnectedComponentGraph':
    case 'DirectProductGraph':
    case 'TripleDirectProductGraph':
      break;
    default: {
      const acceptingStateSet =
        automaton.type === 'EpsilonNFA'
          ? new Set([automaton.acceptingState])
          : automaton.acceptingStateSet;
      for (const q of automaton.stateList) {
        const shape = acceptingStateSet.has(q) ? `doublecircle` : `circle`;
        out += `    ${JSON.stringify(q)} [shape = ${shape}];\n`;
      }
      const initialStateList =
        automaton.type === 'UnorderedNFA'
          ? Array.from(automaton.initialStateSet)
          : [automaton.initialState];
      for (let i = 0; i < initialStateList.length; i++) {
        const q = initialStateList[i];
        const init = `init_${i}`;
        const priority = i + 1;
        out += `    ${JSON.stringify(init)} [shape = point];\n`;
        out += `    ${JSON.stringify(init)} -> ${JSON.stringify(q)}${
          ordered ? ` [taillabel = "${priority}"]` : ``
        };\n`;
      }
    }
  }

  for (const e of edges) {
    out += `    ${JSON.stringify(e.source)} -> ${JSON.stringify(
      e.destination,
    )} [${
      ordered ? `taillabel = "${e.priority}", ` : ``
    }label = ${JSON.stringify(e.label).replace(/\\/g, '\\\\')}];\n`;
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
