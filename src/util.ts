export function equals<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (const e of a) {
    if (!b.has(e)) {
      return false;
    }
  }
  return true;
}

export function isSuperset<T>(set: Set<T>, subset: Set<T>): boolean {
  for (const e of subset) {
    if (!set.has(e)) {
      return false;
    }
  }
  return true;
}

export function isProperSuperset<T>(set_: Set<T>, subset: Set<T>): boolean {
  const set = new Set(set_);
  for (const e of subset) {
    if (!set.has(e)) {
      return false;
    }
    set.delete(e);
  }
  return set.size !== 0;
}

export function intersect<T>(a: Set<T>, b: Set<T>): Set<T> {
  const s = new Set<T>();
  for (const e of a) {
    if (b.has(e)) {
      s.add(e);
    }
  }
  return s;
}

export function assignUnion<T>(set: Set<T>, subset: Set<T>): Set<T> {
  for (const e of subset) {
    set.add(e);
  }
  return set;
}

export function subtract<T>(a: Set<T>, b: Set<T>): Set<T> {
  const c = new Set<T>();
  for (const e of a) {
    if (!b.has(e)) {
      c.add(e);
    }
  }
  return c;
}
