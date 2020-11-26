/**
 * 通常の `string` と区別するための型。
 * `State<T>` の `T` にはその状態が何から作られたものであるかを指定できる。
 * （が、普通に使う分には冗長なので好みで使ってください。）
 * 例:
 * - 状態のペア: `State<[State, State]>`
 * - 状態の集合: `State<Set<State>>`
 */
export type State<T = unknown> = string & { __stateBrand: T };

/**
 * `State.fromHoge` は 状態文字列のタプル・集合 → 状態文字列 の変換のみ提供する。
 * 逆変換をしたい場合は、対応を `Map<State, Hoge>` で保存しておくようにする。
 */
export const State = {
  fromPair<S0 extends State, S1 extends State>(
    statePair: [S0, S1],
  ): State<[S0, S1]> {
    return `(${statePair[0]}, ${statePair[1]})` as State<[S0, S1]>;
  },

  fromTriple<S0 extends State, S1 extends State, S2 extends State>(
    stateTriple: [S0, S1, S2],
  ): State<[S0, S1, S2]> {
    return `(${stateTriple[0]}, ${stateTriple[1]}, ${stateTriple[2]})` as State<
      [S0, S1, S2]
    >;
  },

  fromSet<S extends State>(stateSet: Set<S>): State<Set<S>> {
    return `{${Array.from(stateSet).sort().join(', ')}}` as State<Set<S>>;
  },
};
