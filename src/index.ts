import { stat } from 'fs';
import * as rerejs from 'rerejs';

interface NFA {
  states: State[];
  initialStates: State[];
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
        initialStates: [q0],
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
        childInitialStates.push(...nfa.initialStates);
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
        initialStates: [q0],
        acceptingStates: [q1],
      };
    }
  }
}

function main() {
  const sources = [
    'a',
    'a|b',
  ];
  for (const src of sources) {
    const pat = new rerejs.Parser(src).parse();
    const res = construct(pat);
    console.log(src, res);
  }
}

if (require.main === module) {
  main();
}
