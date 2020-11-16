import {
  Char,
} from './types';

const digit = new Set<number>();
const invertDigit = new Set<number>();
const word = new Set<number>();
const invertWord = new Set<number>();
const space = new Set<number>();
const invertSpace = new Set<number>();
const dot = new Set<number>();

function init() {
  for (let i = 0x00; i <= 0x7f; i++) {
    const c = String.fromCharCode(i);
    if (/^\d$/.test(c)) {
      digit.add(i);
    } else {
      invertDigit.add(i);
    }
    if (/^\w$/.test(c)) {
      word.add(i);
    } else {
      invertWord.add(i);
    }
    if (/^\s$/.test(c)) {
      space.add(i);
    } else {
      invertSpace.add(i);
    }
    dot.add(i);
  }
}

init();

export const alphabet = dot;

export function contains(node: Char, codePoint: number): boolean {
  switch (node.type) {
    case 'Char': {
      return node.value === codePoint;
    }
    case 'EscapeClass': {
      const expectation = !node.invert;
      switch (node.kind) {
        case 'digit':
          return digit.has(codePoint) === expectation;
        case 'word':
          return word.has(codePoint) === expectation;
        case 'space':
          return space.has(codePoint) === expectation;
        case 'unicode_property':
          throw new Error('unimplemented');
        case 'unicode_property_value':
          throw new Error('unimplemented');
      }
    }
    case 'Class': {
      const expectation = !node.invert;
      return node.children.some((child) => {
        switch (child.type) {
          case 'Char':
          case 'EscapeClass': {
            return contains(child, codePoint) === expectation;
          }
          case 'ClassRange': {
            const result = child.children[0].value <= codePoint && codePoint <= child.children[1].value;
            return result === expectation;
          }
        }
      });
    }
    case 'Dot': {
      return true;
    }
  }
}
