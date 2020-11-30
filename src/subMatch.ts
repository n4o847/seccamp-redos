import { Pattern, Node, Group } from 'rerejs';
import { State } from './state';
import { EpsilonNFA, NullableTransition, Char, Atom } from './types';
import { extendAlphabet, getChars } from './char';
import { getDiffieHellman } from 'crypto';

/**
 * 構築された ε-NFA に対し、submatchの遷移を追加する
 */
export function addSubMatchTransitions(
  pattern: Pattern,
  enfa: EpsilonNFA,
): EpsilonNFA {
  return new SubMatchTransitonsBuilder(pattern, enfa).build();
}

class SubMatchTransitonsBuilder {
  constructor(private pattern: Pattern, private enfa: EpsilonNFA) { }
  
  build(): EpsilonNFA {
    switch (this.pattern.child.type) {
      case 'Capture':
      case 'Group': {
        this.buildChild(this.pattern.child.child);
        return this.enfa;
      }
      case 'Sequence':
      case 'Disjunction':
      case 'Optional':
      //case 'Class':
      case 'Many':
      //case 'EscapeClass':
      case 'Some':
      case 'Dot':
      case 'Char':
      case 'LineBegin':
      case 'LineEnd': {
        this.buildChild(this.pattern.child);
        return this.enfa;
      }
    }
    throw new Error("error in submatch");
  }

  private buildChild(
    node: Node,
  ): void {
    switch (node.type) {
      case 'Disjunction': {
        // 始端subMatch　(非貪欲)
        this.enfa.transitions.get(this.enfa.initialState)!.forEach((t, index) => {
          const nodeChild = node.children[index];
          if (
            (nodeChild.type === 'Sequence' && nodeChild.children[0].type !== 'LineBegin') ||
            nodeChild.type === 'Char'
          ) {
            this.setNonGreedyTransitions(t.destination);
          }
        }); 

        // 終端subMatch (貪欲)
        const sources = this.getSourcesOfFinalTransitions();
        sources.forEach((q, index) => {
          const nodeChild: Node = node.children[index];
          if (
            (nodeChild.type === 'Sequence' &&
              nodeChild.children[nodeChild.children.length - 1].type !== 'LineEnd') ||
            nodeChild.type === 'Char'
          ) {
            this.addDotTransition(q);
          }
        });
        return;
      }
      case 'Sequence':
      case 'Optional':
      //case 'Class':
      case 'Many':
      //case 'EscapeClass':
      case 'Some':
      case 'Dot':
      case 'Char': {
        // 始端subMatch (非貪欲)
        if (node.type !== 'Sequence' || node.children[0].type !== 'LineBegin') {
          this.setNonGreedyTransitions(this.enfa.initialState);
        }
        
        // 終端subMatch (貪欲)   
        if (
          node.type !== 'Sequence' ||
          node.children[node.children.length - 1].type !== 'LineEnd'
        ) {
          this.addDotTransition(this.enfa.acceptingState);
        }
        return;
      }
    }
    throw new Error("error in submatch");
  }

  private setNonGreedyTransitions(d: State): void {
    const oldTransitons = this.enfa.transitions.get(d)!;
    const newTransitions: NullableTransition[] = [];
    const chars = this.getDotChars();
    for (const c of chars) {
      newTransitions.push({ epsilon: false, char: c, destination: d });
    }
    for (const t of oldTransitons) {
      newTransitions.push(t);
    }
    this.enfa.transitions.set(d, newTransitions);
  }

  private getSourcesOfFinalTransitions(): State[] {
    const sources: State[] = [];
    for (const [q, ts] of this.enfa.transitions) {
      for (const t of ts) {
        if (t.destination === this.enfa.acceptingState) {
          sources.push(q);
        }
      }
    }
    return sources;
  }  
  
  private getDotChars(): Set<Char> {
    const node: Node = { type: 'Dot', range: [1,1] };
    extendAlphabet(this.enfa.alphabet, node, this.pattern.flagSet);
    return getChars(this.enfa.alphabet, node, this.pattern.flagSet);
  }

  private addDotTransition(s: State): void {
    const chars = this.getDotChars();
    for (const c of chars) {
      this.enfa.transitions.get(s)!.push({ epsilon: false, char: c, destination: s });
    }
  }
}
