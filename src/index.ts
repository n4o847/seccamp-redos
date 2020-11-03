import * as rerejs from 'rerejs';
import { isProperSuperset, assignUnion } from './util';

interface NFA {
  states: State[];
  initialState: State;
  acceptingStates: State[];
}

interface State {
  transitions: Transition[];
}

interface Transition {
  char: rerejs.Char | rerejs.EscapeClass | rerejs.Class | rerejs.Dot | null;
  destination: State;
}

function construct(pattern: rerejs.Pattern): NFA {
  return construct_(pattern.child);
}

function construct_(node: rerejs.Node): NFA {
  switch (node.type) {
    case 'Char':
    case 'EscapeClass':
    case 'Class':
    case 'Dot': {
      const f0: State = { transitions: [] };
      const d0: Transition = { char: node, destination: f0 };
      const q0: State = { transitions: [d0] };
      return {
        states: [q0, f0],
        initialState: q0,
        acceptingStates: [f0],
      };
    }
    case 'Disjunction': {
      const childNFAs = node.children.map((child) => construct_(child));
      const childStates = childNFAs.flatMap((nfa) => nfa.states);
      const childInitialStates = childNFAs.map((nfa) => nfa.initialState);
      const childAcceptingStates = childNFAs.flatMap((nfa) => nfa.acceptingStates);
      const f0: State = { transitions: [] };
      const ds1: Transition[] = childAcceptingStates.map((state) => {
        const d1 = {
          char: null,
          destination: f0,
        };
        state.transitions.push(d1);
        return d1;
      });
      const ds0: Transition[] = childInitialStates.map((state) => {
        return {
          char: null,
          destination: state,
        };
      });
      const q0: State = { transitions: [...ds0] };
      return {
        states: [q0, ...childStates, f0],
        initialState: q0,
        acceptingStates: [f0],
      };
    }
    case 'Sequence': {
      const childNFAs = node.children.map((child) => construct_(child));
      for (let i = 0; i < childNFAs.length - 1; i++) {
        const nfa0 = childNFAs[i];
        const nfa1 = childNFAs[i + 1];
        for (const f0 of nfa0.acceptingStates) {
          f0.transitions.push(...nfa1.initialState.transitions);
        }
      }
      const q0 = childNFAs[0].initialState;
      const childStates: State[] = [];
      for (const nfa of childNFAs) {
        for (const s of nfa.states) {
          if (s === q0 || s !== nfa.initialState) {
            childStates.push(s);
          }
        }
      }
      const fs = childNFAs[childNFAs.length - 1].acceptingStates;
      return {
        states: childStates,
        initialState: q0,
        acceptingStates: fs,
      };
    }
    case 'Many': {
      const childNFA = construct_(node.child);
      const f0: State = { transitions: [] };
      const d3: Transition = { char: null, destination: f0 };
      const d2: Transition = { char: null, destination: f0 };
      const d1: Transition = {
        char: null,
        destination: childNFA.initialState,
      };
      childNFA.acceptingStates.map((f0) => {
        f0.transitions.push(d1);
        f0.transitions.push(d2);
      });
      const d0: Transition = {
        char: null,
        destination: childNFA.initialState,
      }
      const q0: State = {
        transitions: [d0, d3],
      };
      return {
        states: [q0, ...childNFA.states, f0],
        initialState: q0,
        acceptingStates: [f0],
      };
    }
    case 'Capture':
    case 'NamedCapture':
    case 'Group': {
      return construct_(node.child);
    }
    default: {
      throw new Error('Unimplemented!');
    }
  }
}

function expand(states: Set<State>, delta: Set<Transition>): Set<State> {
  let modified = true;
  while (modified) {
    modified = false;
    for (const q of states) {
      const epsilonDestinations =
        new Set(Array.from(delta).filter((d) => d.char === null).map((d) => d.destination));
      if (!isProperSuperset(states, epsilonDestinations)) {
        assignUnion(states, epsilonDestinations);
        modified = true;
      }
    }
  }
  return states;
}

function toDOT(nfa: NFA): string {
  interface Edge {
    src: string;
    dst: string;
    label: string;
  }

  let _id = 0;
  const id = () => `q${_id++}`;
  const stateToId = new Map<State, string>();
  const transitions: Edge[] = [];
  for (const state of nfa.states) {
    if (!stateToId.has(state)) {
      stateToId.set(state, id());
    }
  }
  for (const state of nfa.states) {
    for (const d of state.transitions) {
      transitions.push({
        src: stateToId.get(state)!,
        dst: stateToId.get(d.destination)!,
        label: d.char === null ? 'ε' :
               d.char.type === 'Dot' ? 'Σ' :
               rerejs.nodeToString(d.char),
      });
    }
  }
  let out = '';
  out += `digraph G {\n`;
  for (const f of nfa.acceptingStates) {
    out += `    ${stateToId.get(f)} [shape=doublecircle];\n`;
  }
  for (const e of transitions.values()) {
    out += `    ${e.src} -> ${e.dst} [label = ${JSON.stringify(e.label)}];\n`;
  }
  out += `}\n`;
  return out;
}

function main() {
  const sources = [
    String.raw`a`,
    String.raw`\s`,
    String.raw`a|b`,
    String.raw`ab`,
    String.raw`a*`,
    String.raw`(?:a|bc)`,
    String.raw`(a*)*`,
    String.raw`(\w|\d)*`,
    String.raw`(.*)="(.*)"`,
    String.raw`[a-z][0-9a-z]*`,
  ];
  for (const src of sources) {
    console.log(src);
    const pat = new rerejs.Parser(src).parse();
    const res = construct(pat);
    console.log(toDOT(res));
  }
}

if (require.main === module) {
  main();
}
