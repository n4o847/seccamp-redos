import { getLeftString, getRightString } from './directProduct';
import { DirectProductNFA, Message } from './types';

/**
 * 強連結成分を一つ一つ見ていき、EDAを持つかメッセージを返す
 */
export function showMessageEDA(dps: DirectProductNFA[]): Message {
  // 別の経路で同じ文字で移動して自身に戻れたらEDA
  if (dps.some((dp) => isEDA(dp))) {
    return { state: 'Vulnerable', message: 'Ditected EDA.' };
  } else {
    return { state: 'Safe', message: "Don't have EDA." };
  }
}

function isEDA(dp: DirectProductNFA): boolean {
  // 別の点に同じ文字w1で遷移できてかつ同じ文字w2で自分に戻れるか判定する
  const lrSame = dp.stateList.filter(
    (state) => getLeftString(state) === getRightString(state),
  );
  const lrDifferent = dp.stateList.filter(
    (state) => getLeftString(state) !== getRightString(state),
  );
  return lrSame.length > 0 && lrDifferent.length > 0;
}
