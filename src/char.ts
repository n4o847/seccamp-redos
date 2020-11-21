import { CharSet, FlagSet } from 'rerejs';
import { Atom } from './types';

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
