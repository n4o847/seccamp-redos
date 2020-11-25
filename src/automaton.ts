import { State, Char } from './types';

/** 遷移関数を扱うためのクラス。 */
export class TransitionMap {
  private stateList: State[];
  private alphabet: Set<Char>;
  private map: Map<State, Map<Char, State[]>>;

  constructor(stateList: State[], alphabet: Set<Char>) {
    this.stateList = stateList;
    this.alphabet = alphabet;
    this.map = new Map(
      stateList.map((q) => [
        q,
        new Map(Array.from(alphabet).map((ch) => [ch, []])),
      ]),
    );
  }

  get(source: State, char: Char): State[] {
    return this.map.get(source)!.get(char)!;
  }

  add(source: State, char: Char, destination: State): void {
    this.get(source, char).push(destination);
  }

  *[Symbol.iterator](): Iterator<
    [source: State, char: Char, destination: State]
  > {
    for (const source of this.stateList) {
      for (const char of this.alphabet) {
        for (const destination of this.get(source, char)) {
          yield [source, char, destination];
        }
      }
    }
  }

  /** 非破壊的にリバースした遷移を得る。 */
  reverse(): TransitionMap {
    const reversed = new TransitionMap(this.stateList, this.alphabet);
    for (const [source, char, destination] of this) {
      reversed.add(destination, char, source);
    }
    return reversed;
  }
}
