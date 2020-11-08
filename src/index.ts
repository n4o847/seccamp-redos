import * as rerejs from 'rerejs';

type NFA =
  | NormalizedNFA
  | NonNormalizedNFA;

type NormalizedNFA = {
  normalized: true;
  states: State[];
  initialState: State;
  acceptingState: State;
  transitions: Map<State, Transition[]>;
};

type NonNormalizedNFA = {
  normalized: false;
  states: State[];
  initialStates: State[];
  acceptingStates: Set<State>;
  transitions: Map<State, Transition[]>;
};

type State = {
  id: string;
};

type Char =
  | rerejs.Char
  | rerejs.EscapeClass
  | rerejs.Class
  | rerejs.Dot;

type Transition = {
  char: Char | null;
  destination: State;
};

class NFABuilder {
  private states: State[] = [];
  private transitions: Map<State, Transition[]> = new Map();
  private stateId = 0;

  constructor(
    private pattern: rerejs.Pattern,
  ) {}

  build(): NormalizedNFA {
    this.states = [];
    this.transitions = new Map();
    this.stateId = 0;
    const { initialState, acceptingState } = this.buildChild(this.pattern.child);
    return {
      normalized: true,
      states: this.states,
      initialState,
      acceptingState,
      transitions: this.transitions,
    };
  }

  private buildChild(node: rerejs.Node): Pick<NormalizedNFA, 'initialState' | 'acceptingState'> {
    switch (node.type) {
      case 'Char':
      case 'EscapeClass':
      case 'Class':
      case 'Dot': {
        const q0 = this.createState();
        const f0 = this.createState();
        this.addTransition(q0, node, f0);
        return {
          initialState: q0,
          acceptingState: f0,
        };
      }
      case 'Disjunction': {
        const childNFAs = node.children.map((child) => this.buildChild(child));
        const q0 = this.createState();
        const f0 = this.createState();
        for (const childNFA of childNFAs) {
          const q1 = childNFA.initialState;
          const f1 = childNFA.acceptingState;
          this.addTransition(q0, null, q1);
          this.addTransition(f1, null, f0);
        }
        return {
          initialState: q0,
          acceptingState: f0,
        };
      }
      case 'Sequence': {
        if (node.children.length === 0) {
          const q0 = this.createState();
          const f0 = this.createState();
          this.addTransition(q0, null, f0);
          return {
            initialState: q0,
            acceptingState: f0,
          };
        } else {
          const childNFAs = node.children.map((child) => this.buildChild(child));
          for (let i = 0; i < childNFAs.length - 1; i++) {
            const f1 = childNFAs[i].acceptingState;
            const q2 = childNFAs[i + 1].initialState;
            this.addTransition(f1, null, q2);
          }
          const q0 = childNFAs[0].initialState;
          const f0 = childNFAs[childNFAs.length - 1].acceptingState;
          return {
            initialState: q0,
            acceptingState: f0,
          };
        }
      }
      case 'Many': {
        const childNFA = this.buildChild(node.child);
        const q0 = this.createState();
        const f0 = this.createState();
        const q1 = childNFA.initialState;
        const f1 = childNFA.acceptingState;
        if (node.nonGreedy) {
          this.addTransition(q0, null, f0);
          this.addTransition(q0, null, q1);
          this.addTransition(f1, null, f0);
          this.addTransition(f1, null, q1);
        } else {
          this.addTransition(q0, null, q1);
          this.addTransition(q0, null, f0);
          this.addTransition(f1, null, q1);
          this.addTransition(f1, null, f0);
        }
        return {
          initialState: q0,
          acceptingState: f0,
        };
      }
      case 'Capture':
      case 'NamedCapture':
      case 'Group': {
        return this.buildChild(node.child);
      }
      default: {
        throw new Error('Unimplemented!');
      }
    }
  }

  private createState(): State {
    const state = {
      id: `q${this.stateId++}`,
    };
    this.states.push(state);
    this.transitions.set(state, []);
    return state;
  }

  private addTransition(source: State, char: Char | null, destination: State): void {
    this.transitions.get(source)!.push({ char, destination });
  }
}

function eliminateEpsilonTransitions(nfa: NormalizedNFA): NonNormalizedNFA {
  const states = nfa.states;
  const initialStates = [nfa.initialState];
  const acceptingStates = new Set([nfa.acceptingState]);
  const transitions = new Map(nfa.transitions);
  let modified = true;
  while (modified) {
    modified = false;
    const toEliminate = new Set<Transition>();
    for (const q0 of states) {
      const q0Transitions: Transition[] = [];
      for (const d0 of transitions.get(q0)!) {
        q0Transitions.push(d0);
        const q1 = d0.destination;
        for (const d1 of transitions.get(q1)!) {
          if (d1.char === null) {
            if (!transitions.get(q0)!.find(({ char, destination }) => char === d0.char && destination === d1.destination)) {
              q0Transitions.push({
                char: d0.char,
                destination: d1.destination,
              });
              modified = true;
            }
            toEliminate.add(d1);
            if (acceptingStates.has(d1.destination)) {
              acceptingStates.add(q1);
            }
          }
        }
      }
      transitions.set(q0, q0Transitions);
    }
    for (const q0 of states) {
      transitions.set(q0, transitions.get(q0)!.filter((d0) => !toEliminate.has(d0)));
    }
  }
  for (const d0 of transitions.get(nfa.initialState)!) {
    if (d0.char === null) {
      initialStates.push(d0.destination);
    }
  }
  transitions.set(nfa.initialState, transitions.get(nfa.initialState)!.filter((d0) => d0.char !== null));
  return {
    normalized: false,
    states,
    initialStates,
    acceptingStates,
    transitions,
  };
}

function toDOT(nfa: NFA): string {
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
  const acceptingStates = nfa.normalized ? new Set([nfa.acceptingState]) : nfa.acceptingStates;
  for (const q of nfa.states) {
    const shape = acceptingStates.has(q) ? `doublecircle` : `circle`;
    out += `    ${q.id} [shape = ${shape}];\n`;
  }
  const initialStates = nfa.normalized ? [nfa.initialState] : nfa.initialStates;
  for (let i = 0; i < initialStates.length; i++) {
    const q = initialStates[i];
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

function main() {
  const sources = [
    String.raw`a`,
    String.raw`\s`,
    String.raw`a|b`,
    String.raw`ab`,
    String.raw`a*`,
    String.raw`a*?`,
    String.raw`(?:)`,
    String.raw`(?:a|bc)`,
    String.raw`(a*)*`,
    String.raw`(\w|\d)*`,
    String.raw`(.*)="(.*)"`,
    String.raw`[a-z][0-9a-z]*`,
  ];
  for (const src of sources) {
    console.log(src);
    const pat = new rerejs.Parser(src).parse();
    const enfa = new NFABuilder(pat).build();
    console.log(toDOT(enfa));
    const nfa = eliminateEpsilonTransitions(enfa);
    console.log(toDOT(nfa));
  }
}

if (require.main === module) {
  main();
}
