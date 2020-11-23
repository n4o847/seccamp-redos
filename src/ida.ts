import { buildStronglyConnectedComponents } from './scc';
import { TripleDirectProductNFA, Message } from './types';

export function showMessageIDA(tdps: TripleDirectProductNFA[]): Message {
  if (tdps.some((tdp) => isIDA(tdp))) {
    return { status: 'Vulnerable', message: 'Detected IDA.' };
  } else {
    return { status: 'Safe', message: "Don't have IDA." };
  }
}

function isIDA(tdp: TripleDirectProductNFA): boolean {
  const sccs = buildStronglyConnectedComponents(tdp);
  return sccs.some((scc) => {
    // 追加辺 (q1, q2, q2) => (q1, q1, q2) に対応する辺 (q1, q1, q2) => (q1, q2, q2) が強連結成分内の辺として存在するかどうかを判定

    for (const [q, ts] of tdp.extraTransitions) {
      for (const t of ts) {
        return scc.transitions
          .get(t.destination)
          ?.some((scc_dest) => scc_dest.destination === q);
      }
    }
    return false;
  });
}
