import { State } from './state';
import { Char } from './types';

/** 遷移関数を扱うためのクラス。 */
export class TransitionMap {
  private map: Map<State, Map<Char, State[]>> = new Map();

  get(source: State, char: Char): State[] {
    return this.map.get(source)?.get(char) ?? [];
  }

  getTransitions(source: State): Map<Char, State[]> | [] {
    return this.map.get(source) ?? [];
  }

  // あるcharの遷移を持つsourceとdestinationの組を全て取り出す
  getTuplesFromChar(a: Char): [State, State][] {
    const retTuples: [State, State][] = [];
    for (const [source, char, destination] of this) {
      if (a === char) {
        retTuples.push([source, destination]);
      }
    }
    return retTuples;
  }

  getSourceCharTuples(): [State, Char][] {
    const retTuples: [State, Char][] = [];
    for (const source of this.map.keys()) {
      for (const char of this.map.get(source)!.keys()) {
        retTuples.push([source, char]);
      }
    }
    return retTuples;
  }

  has(source: State, char: Char, destination: State): boolean {
    return this.get(source, char).includes(destination);
  }

  add(source: State, char: Char, destination: State): void {
    let fromSource = this.map.get(source);
    if (fromSource === undefined) {
      fromSource = new Map();
      this.map.set(source, fromSource);
    }

    let viaChar = fromSource.get(char);
    if (viaChar === undefined) {
      viaChar = [];
      fromSource.set(char, viaChar);
    }

    viaChar.push(destination);
  }

  *[Symbol.iterator](): Iterator<
    [source: State, char: Char, destination: State]
  > {
    for (const [source, fromSource] of this.map) {
      for (const [char, viaChar] of fromSource) {
        for (const destination of viaChar) {
          yield [source, char, destination];
        }
      }
    }
  }

  /** 非破壊的にリバースした遷移を得る。 */
  reverse(): TransitionMap {
    const reversed = new TransitionMap();
    for (const [source, char, destination] of this) {
      reversed.add(destination, char, source);
    }
    return reversed;
  }
}
