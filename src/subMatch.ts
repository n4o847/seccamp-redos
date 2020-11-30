import { Pattern, Node } from 'rerejs';
import { State } from './state';
import { EpsilonNFA, NullableTransition } from './types';

/**
 * 構築された ε-NFA に対し、submatchの遷移を追加する
 */
export function addSubMatchTransitions(
  pattern: Pattern,
  enfa: EpsilonNFA,
): EpsilonNFA {
  console.log(pattern);
  if (pattern.child.type === 'Disjunction') {
    const disjunctionChildren: Node[] = pattern.child.children;

    // 始端subMatch　(非貪欲)
    enfa.transitions.get(enfa.initialState)!.forEach((t, index) => {
      const node: Node = disjunctionChildren[index];
      if (node.type === 'Sequence' && node.children[0].type !== 'LineBegin') {
        enfa.transitions
          .get(t.destination)!
          .push({ epsilon: true, destination: t.destination });
      } else if (node.type === 'Char') {
        enfa.transitions
          .get(t.destination)!
          .push({ epsilon: true, destination: t.destination });
      }
    });

    // 終端subMatch (貪欲)
    const sources = getSourcesOfFinalTransitions(enfa);
    sources.forEach((q, index) => {
      const node: Node = disjunctionChildren[index];
      if (
        (node.type === 'Sequence' &&
          node.children[node.children.length - 1].type !== 'LineEnd') ||
        node.type === 'Char'
      ) {
        const oldTransitons = enfa.transitions.get(q)!;
        const newTransitions: NullableTransition[] = [
          { epsilon: true, destination: q },
        ];
        for (const t of oldTransitons) {
          newTransitions.push(t);
        }
        enfa.transitions.set(q, newTransitions);
      }
    });
  } else {
    // 始端subMatch (非貪欲)
    if (
      pattern.child.type !== 'Sequence' ||
      pattern.child.children[0].type !== 'LineBegin'
    ) {
      enfa.transitions
        .get(enfa.initialState)!
        .push({ epsilon: true, destination: enfa.initialState });
    }

    // 終端subMatch (貪欲)
    if (
      pattern.child.type !== 'Sequence' ||
      pattern.child.children[pattern.child.children.length - 1].type !==
        'LineEnd'
    ) {
      const source = getSourcesOfFinalTransitions(enfa).filter(
        (q) => q !== enfa.initialState,
      );
      const oldTransitons = enfa.transitions.get(source[0])!;
      const newTransitions: NullableTransition[] = [
        { epsilon: true, destination: source[0] },
      ];
      for (const t of oldTransitons) {
        newTransitions.push(t);
      }
      enfa.transitions.set(source[0], newTransitions);
    }
  }
  return enfa;
}

function getSourcesOfFinalTransitions(enfa: EpsilonNFA): State[] {
  const sources: State[] = [];
  for (const [q, ts] of enfa.transitions) {
    for (const t of ts) {
      if (t.destination === enfa.acceptingState) {
        sources.push(q);
      }
    }
  }
  return sources;
}
