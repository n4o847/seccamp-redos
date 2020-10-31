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
  char: rerejs.Char;
}

function construct(pattern: rerejs.Pattern): NFA {
  return construct_(pattern.child);
}

function construct_(node: rerejs.Node): NFA {
  switch (node.type) {
    case 'Char':
      const d0: Transition = { char: node };
      const q0: State = { transitions: [d0] };
      const q1: State = { transitions: [] };
      return {
        states: [q0, q1],
        initialStates: [q0],
        acceptingStates: [q1],
      };
  }
}

function main() {
  const pat = new rerejs.Parser('a').parse();
  const res = construct(pat);
  console.log(res);
}

if (require.main === module) {
  main();
}
