import { buildStronglyConnectedComponents } from './scc';
import { State } from './state';
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
    // (lq, lq, rq) と (lq, rq, rq) が存在するか
    for (const [lq, cq, rq] of scc.stateList.map((s) => s.split('_'))) {
      const state = `${lq}_${rq}_${rq}` as State;
      if (lq === cq && scc.stateList.includes(state)) {
        return true;
      }
    }
    return false;
  });
}
