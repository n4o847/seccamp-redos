import { getLeftString, getRightString } from './directProduct';
import { buildStronglyConnectedComponents } from './scc';
import { DirectProductNFA, Message } from './types';

/**
 * 強連結成分を一つ一つ見ていき、EDAを持つかメッセージを返す
 */
export function showMessageEDA(dps: DirectProductNFA[]): Message {
  // 別の経路で同じ文字で移動して自身に戻れたらEDA
  if (dps.some((dp) => isEDA(dp))) {
    return { status: 'Vulnerable', message: 'Detected EDA.' };
  } else {
    return { status: 'Safe', message: "Don't have EDA." };
  }
}

function isEDA(dp: DirectProductNFA): boolean {
  const sccs = buildStronglyConnectedComponents(dp);
  return sccs.some((scc) => {
    // Setがもとの二重辺の配列よりサイズが小さくなれば二重辺が存在
    for (const source of scc.stateList) {
      const loopBackStringArray = scc.transitions
        .get(source)!
        .filter((tr) => {
          return source === tr.destination;
        })
        .map((tr) => {
          return tr.charSet.toString();
        });
      const loopBackStringSet = new Set(loopBackStringArray);

      if (loopBackStringSet.size < loopBackStringArray.length) {
        return true;
      }
    }

    const lrSame = scc.stateList.filter(
      (state) => getLeftString(state) === getRightString(state),
    );
    // (n, n), (m, k) (m !== k)が存在(すべて同じじゃないが全て異なるわけではない)
    return lrSame.length < scc.stateList.length && lrSame.length > 0;
  });
}
