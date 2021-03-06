import { State } from './state';
import { Char } from './types';

/** 遷移関数を扱うためのクラス。 */
export class TransitionMap {
  private map: Map<State, Map<Char, State[]>> = new Map();

  get(source: State, char: Char): State[] {
    return this.map.get(source)?.get(char) ?? [];
  }

  getTransitions(source: State): Map<Char, State[]> {
    let fromSource = this.map.get(source);
    if (fromSource === undefined) {
      fromSource = new Map();
      this.map.set(source, fromSource);
    }
    return fromSource;
  }

  *keys(): IterableIterator<[State, Char]> {
    for (const source of this.map.keys()) {
      for (const char of this.getTransitions(source).keys()) {
        yield [source, char];
      }
    }
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
