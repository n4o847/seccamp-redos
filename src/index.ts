import { stat } from 'fs';
import * as rerejs from 'rerejs';

interface NFA {
  states: State[];
  initialState: State;
  acceptingStates: State[];
}

interface State {
  transitions: Transition[];
}

interface Transition {
  char: rerejs.Char | null;
  destination: State;
}

function construct(pattern: rerejs.Pattern): NFA {
  return construct_(pattern.child);
}

function construct_(node: rerejs.Node): NFA {
  switch (node.type) {
    case 'Char': {
      const q1: State = { transitions: [] };
      const d0: Transition = { char: node, destination: q1 };
      const q0: State = { transitions: [d0] };
      return {
        states: [q0, q1],
        initialState: q0,
        acceptingStates: [q1],
      };
    }
    case 'Disjunction': {
      const childStates: State[] = [];
      const childInitialStates: State[] = [];
      const childAcceptingStates: State[] = [];
      node.children.map((child) => {
        const nfa = construct_(child);
        childStates.push(...nfa.states);
        childInitialStates.push(nfa.initialState);
        childAcceptingStates.push(...nfa.acceptingStates);
      });
      const q1: State = { transitions: [] };
      const ds1: Transition[] = childAcceptingStates.map((state) => {
        const d1 = {
          char: null,
          destination: q1,
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
        states: [q0, ...childStates, q1],
        initialState: q0,
        acceptingStates: [q1],
      };
    }
    case 'Sequence': {
      const nfas = node.children.map((child) => construct_(child));
      for (let i = 0; i < nfas.length - 1; i++) {
        const nfa0 = nfas[0];
        const nfa1 = nfas[1];
        for (const f0 of nfa0.acceptingStates) {
          f0.transitions.push(...nfa1.initialState.transitions);
        }
      }
      const q0 = nfas[0].initialState;
      const childStates: State[] = [];
      for (const nfa of nfas) {
        for (const s of nfa.states) {
          if (s === q0 || s !== nfa.initialState) {
            childStates.push(s);
          }
        }
      }
      const fs = nfas[nfas.length - 1].acceptingStates;
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
  }
}

function toDOT(nfa: NFA): string {
  interface Edge {
    src: string;
    dst: string;
    label: string;
  }

  let _id = 0;
  const id = () => _id++;
  const stateToId = new Map<State, number>();
  const transitions: Edge[] = [];
  for (const state of nfa.states) {
    if (!stateToId.has(state)) {
      stateToId.set(state, id());
    }
  }
  for (const state of nfa.states) {
    for (const d of state.transitions) {
      transitions.push({
        src: `q${stateToId.get(state)}`,
        dst: `q${stateToId.get(d.destination)}`,
        label: d.char === null ? 'ε' : d.char.raw,
      });
    }
  }
  let out = '';
  out += `digraph G {\n`;
  for (const e of transitions.values()) {
    out += `\t${e.src} -> ${e.dst} [label = "${e.label}"];\n`;
  }
  out += `}\n`;
  return out;
}

function main() {
  const sources = [
    'a',
    'a|b',
    'ab',
    'a*',
    '(?:a|bc)*',
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
