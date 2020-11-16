import {
  Char,
} from './types';

const digit = new Set<string>();
const invertDigit = new Set<string>();
const word = new Set<string>();
const invertWord = new Set<string>();
const space = new Set<string>();
const invertSpace = new Set<string>();
const dot = new Set<string>();

function init() {
  for (let i = 0x00; i <= 0x7f; i++) {
    const c = String.fromCharCode(i);
    if (/^\d$/.test(c)) {
      digit.add(c);
    } else {
      invertDigit.add(c);
    }
    if (/^\w$/.test(c)) {
      word.add(c);
    } else {
      invertWord.add(c);
    }
    if (/^\s$/.test(c)) {
      space.add(c);
    } else {
      invertSpace.add(c);
    }
    dot.add(c);
  }
}

init();

export const alphabet = dot;

export function contains(node: Char, char: string): boolean {
  switch (node.type) {
    case 'Char': {
      return node.raw === char;
    }
    case 'EscapeClass': {
      const expectation = !node.invert;
      switch (node.kind) {
        case 'digit':
          return digit.has(char) === expectation;
        case 'word':
          return word.has(char) === expectation;
        case 'space':
          return space.has(char) === expectation;
        case 'unicode_property':
          throw new Error('unimplemented');
        case 'unicode_property_value':
          throw new Error('unimplemented');
      }
    }
    case 'Class': {
      const expectation = !node.invert;
      for (const child of node.children) {
        switch (child.type) {
          case 'Char':
          case 'EscapeClass': {
            if (contains(child, char) === expectation) {
              return true;
            }
            break;
          }
          case 'ClassRange': {
            const result = child.children[0].raw <= char && char <= child.children[1].raw;
            if (result === expectation) {
              return true;
            }
            break;
          }
        }
      }
      return false;
    }
    case 'Dot': {
      return true;
    }
  }
}
