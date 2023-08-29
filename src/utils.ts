export function moveDown<A>(i: number, l: A[]): A[] {
  console.log("D", i, l);
  if (i > l.length - 2) return l;
  return [...l.slice(0, i), l[i + 1], l[i], ...l.slice(i + 2)];
}

export function moveUp<A>(i: number, l: A[]): A[] {
  console.log("U", i, l);

  if (i < 1) return l;
  return [...l.slice(0, i - 1), l[i], l[i - 1], ...l.slice(i + 1)];
}
