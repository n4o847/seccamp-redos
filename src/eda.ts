import { getLeftState, getRightState } from './directProduct';
import { buildStronglyConnectedComponents } from './scc';
import { DirectProductGraph, Message } from './types';

/**
 * 強連結成分を一つ一つ見ていき、EDAを持つかメッセージを返す
 */
export function showMessageEDA(dps: DirectProductGraph[]): Message {
  // 別の経路で同じ文字で移動して自身に戻れたらEDA
  if (dps.some((dp) => isEDA(dp))) {
    return { status: 'Vulnerable', message: 'Detected EDA.' };
  } else {
    return { status: 'Safe', message: "Don't have EDA." };
  }
}

function isEDA(dp: DirectProductGraph): boolean {
  const sccs = buildStronglyConnectedComponents(dp);
  return sccs.some((scc) => {
    // 遷移元と遷移先が同じ遷移が複数存在するかを検出
    for (const source of scc.stateList) {
      for (const char of scc.alphabet) {
        const destinationArray = scc.transitions
          .get(source, char)
          .filter((d) => d === source);

        if (destinationArray.length >= 2) {
          return true;
        }
      }
    }

    const lrSame = scc.stateList.filter(
      (state) => getLeftState(state) === getRightState(state),
    );
    // (n, n), (m, k) (m !== k)が存在(すべて同じじゃないが全て異なるわけではない)
    return lrSame.length < scc.stateList.length && lrSame.length > 0;
  });
}
