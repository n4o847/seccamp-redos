import { getLeftString, getRightString } from './directProduct';
import { DirectProductNFA } from './types';

/**
 * 強連結成分を一つ一つ見ていき、一つでもEDA経路があったらtrueを返す。
 */
export function hasEDA(dps: DirectProductNFA[]): boolean {
  // 別の経路で同じ文字で移動して自身に戻れたらEDA
  return dps.some((dp) => isEDA(dp));
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
