import { buildStronglyConnectedComponents } from './scc';
import { TripleDirectProductGraph, Message } from './types';

export function showMessageIDA(tdps: TripleDirectProductGraph[]): Message {
  if (tdps.some((tdp) => isIDA(tdp))) {
    return { status: 'Vulnerable', message: 'Detected IDA.' };
  } else {
    return { status: 'Safe', message: "Don't have IDA." };
  }
}

function isIDA(tdp: TripleDirectProductGraph): boolean {
  const sccs = buildStronglyConnectedComponents(tdp);
  return sccs.some((scc) => {
    // 追加辺 (q1, q2, q2) => (q1, q1, q2) に対応する辺 (q1, q1, q2) => (q1, q2, q2) が強連結成分内の辺として存在するかどうかを判定

    for (const [q, char, d] of tdp.extraTransitions) {
      if (scc.transitions.get(d, char).includes(q)) {
        return true;
      }
    }
    return false;
  });
}
