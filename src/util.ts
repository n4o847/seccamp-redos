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

export function assignUnion<T>(set: Set<T>, subset: Set<T>): Set<T> {
  for (const e of subset) {
    set.add(e);
  }
  return set;
}
