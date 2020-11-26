import { CharSet, FlagSet } from 'rerejs';
import { Atom, Char } from './types';
import { subtract } from './util';

const DIGIT = new Set<Char>();
const WORD = new Set<Char>();
const SPACE = new Set<Char>();

// \x00 から \xff までの範囲で対応
for (let c = 0x00; c <= 0xff; c++) {
  const s = String.fromCharCode(c);
  if (/^\d$/.test(s)) {
    DIGIT.add(s);
  }
  if (/^\w$/.test(s)) {
    WORD.add(s);
  }
  if (/^\s$/.test(s)) {
    SPACE.add(s);
  }
}

/**
 * オートマトン構築時に出現する文字を集める。
 */
export function extendAlphabet(
  alphabet: Set<Char>,
  node: Atom,
  flagSet: FlagSet,
): void {
  switch (node.type) {
    case 'Char': {
      let char = node.raw;
      if (flagSet.ignoreCase) {
        char = canonicalizeChar(char);
      }
      alphabet.add(char);
      return;
    }
    case 'EscapeClass': {
      switch (node.kind) {
        case 'digit': {
          for (const ch of DIGIT) {
            alphabet.add(ch);
          }
          break;
        }
        case 'word': {
          for (const ch of WORD) {
            alphabet.add(ch);
          }
          break;
        }
        case 'space': {
          for (const ch of SPACE) {
            alphabet.add(ch);
          }
          break;
        }
        case 'unicode_property': {
          throw new Error('unimplemented');
        }
        case 'unicode_property_value': {
          throw new Error('unimplemented');
        }
      }
      if (node.invert) {
        alphabet.add(null);
      }
      return;
    }
    case 'Class': {
      for (const child of node.children) {
        switch (child.type) {
          case 'Char':
          case 'EscapeClass': {
            extendAlphabet(alphabet, child, flagSet);
            break;
          }
          case 'ClassRange': {
            const begin = child.children[0].value;
            const end = child.children[1].value + 1;
            for (let c = begin; c < end; c++) {
              let s = String.fromCharCode(c);
              if (flagSet.ignoreCase) {
                s = canonicalizeChar(s);
              }
              alphabet.add(s);
            }
            break;
          }
        }
      }
      if (node.invert) {
        alphabet.add(null);
      }
      return;
    }
    case 'Dot': {
      alphabet.add(null);
      return;
    }
  }
}

/**
 * 構築済みの alphabet から対象となる文字を集める。
 */
export function getChars(
  alphabet: Set<Char>,
  node: Atom,
  flagSet: FlagSet,
): Set<Char> {
  switch (node.type) {
    case 'Char': {
      let char = node.raw;
      if (flagSet.ignoreCase) {
        char = canonicalizeChar(char);
      }
      return new Set([char]);
    }
    case 'EscapeClass': {
      switch (node.kind) {
        case 'digit': {
          if (!node.invert) {
            return new Set(DIGIT);
          } else {
            return subtract(alphabet, DIGIT);
          }
        }
        case 'word': {
          if (!node.invert) {
            return new Set(WORD);
          } else {
            return subtract(alphabet, WORD);
          }
        }
        case 'space': {
          if (!node.invert) {
            return new Set(SPACE);
          } else {
            return subtract(alphabet, SPACE);
          }
        }
        case 'unicode_property': {
          throw new Error('unimplemented');
        }
        case 'unicode_property_value': {
          throw new Error('unimplemented');
        }
      }
    }
    case 'Class': {
      const chars = new Set<Char>();
      for (const child of node.children) {
        switch (child.type) {
          case 'Char':
          case 'EscapeClass': {
            for (const ch of getChars(alphabet, child, flagSet)) {
              chars.add(ch);
            }
            break;
          }
          case 'ClassRange': {
            const begin = child.children[0].value;
            const end = child.children[1].value + 1;
            for (let c = begin; c < end; c++) {
              let s = String.fromCharCode(c);
              if (flagSet.ignoreCase) {
                s = canonicalizeChar(s);
              }
              chars.add(s);
            }
            break;
          }
        }
      }
      if (!node.invert) {
        return chars;
      } else {
        return subtract(alphabet, chars);
      }
    }
    case 'Dot': {
      return new Set(alphabet);
    }
  }
}

export function canonicalizeChar(char: string): string {
  return char.toUpperCase();
}

/* 以下旧実装 */

export const MAX_CODE_POINT = 0x110000;

const digit = new CharSet();
digit.add(0x30, 0x39 + 1);

const invertDigit = digit.clone().invert();

const word = new CharSet();
word.add(0x30, 0x39 + 1);
word.add(0x41, 0x5a + 1);
word.add(0x61, 0x7a + 1);
word.add(0x5f, 0x5f + 1);

const invertWord = word.clone().invert();

const space = new CharSet();
space.add(0x09, 0x0d + 1);
space.add(0xa0, 0xa0 + 1);
space.add(0xfeff, 0xfeff + 1);
// space.addCharSet(/* Any other Unicode "Space_Separator" code point */);

const invertSpace = space.clone().invert();

const dot = new CharSet().invert();

export function createCharSet(node: Atom, flagSet: FlagSet): CharSet {
  switch (node.type) {
    case 'Char': {
      const charSet = new CharSet();
      let value = node.value;
      if (flagSet.ignoreCase) {
        value = canonicalize(node.value);
      }
      charSet.add(value, value + 1);
      return charSet;
    }
    case 'EscapeClass': {
      switch (node.kind) {
        case 'digit': {
          return node.invert ? invertDigit : digit;
        }
        case 'word': {
          return node.invert ? invertWord : word;
        }
        case 'space': {
          return node.invert ? invertSpace : space;
        }
        case 'unicode_property': {
          throw new Error('unimplemented');
        }
        case 'unicode_property_value': {
          throw new Error('unimplemented');
        }
      }
    }
    case 'Class': {
      const charSet = new CharSet();
      for (const child of node.children) {
        switch (child.type) {
          case 'Char':
          case 'EscapeClass': {
            charSet.addCharSet(createCharSet(child, flagSet));
            break;
          }
          case 'ClassRange': {
            const begin = child.children[0].value;
            const end = child.children[1].value + 1;
            if (flagSet.ignoreCase) {
              for (let value = begin; value < end; value++) {
                const canonicalizedValue = canonicalize(value);
                charSet.add(canonicalizedValue, canonicalizedValue + 1);
              }
            } else {
              charSet.add(begin, end);
            }
            break;
          }
        }
      }
      if (node.invert) {
        charSet.invert();
      }
      return charSet;
    }
    case 'Dot': {
      return dot;
    }
  }
}

export function canonicalize(value: number): number {
  return String.fromCharCode(value).toUpperCase().charCodeAt(0);
}

export function intersectCharSets(...charSets: CharSet[]): CharSet {
  const intersection = new CharSet();
  for (const cs of charSets) {
    intersection.addCharSet(cs.clone().invert());
  }
  intersection.invert();
  return intersection;
}

// WARNING: 複数のCharSetのdataの積集合を取る場合, intersectCharSets関数利用を推奨
export function enumerateCharset(charSet: CharSet): Set<number> {
  const enumSet: Set<number> = new Set();

  for (let i = 0; i < charSet.data.length - 1; i += 2) {
    const len = charSet.data[i + 1] - charSet.data[i];
    [...new Array(len)]
      .map((_, j) => {
        return charSet.data[i] + j;
      })
      .forEach((v) => {
        enumSet.add(v);
      });
  }
  return enumSet;
}
