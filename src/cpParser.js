export function parseCp(text, weighted) {
  const lines = text
    .trim()
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'));

  if (lines.length === 0) throw new Error('Input is empty.');

  const header = lines[0].split(/\s+/);
  if (header.length < 2) throw new Error('First line must have two integers: n m');

  const n = parseInt(header[0], 10);
  const m = parseInt(header[1], 10);

  if (isNaN(n) || isNaN(m) || n < 0 || m < 0)
    throw new Error('n and m must be non-negative integers.');

  if (lines.length - 1 < m)
    throw new Error(`Expected ${m} edge lines but only found ${lines.length - 1}.`);

  const nodes = Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    label: String(i + 1),
  }));

  const edges = [];
  for (let i = 0; i < m; i++) {
    const parts = lines[1 + i].split(/\s+/);
    if (parts.length < 2)
      throw new Error(`Edge line ${i + 1} must have at least u and v.`);

    const u = parseInt(parts[0], 10);
    const v = parseInt(parts[1], 10);
    const w = parts.length >= 3 ? parseFloat(parts[2]) : 1;

    if (isNaN(u) || isNaN(v))
      throw new Error(`Edge line ${i + 1}: u and v must be integers.`);
    if (u < 1 || u > n)
      throw new Error(`Edge line ${i + 1}: node ${u} is out of range [1, ${n}].`);
    if (v < 1 || v > n)
      throw new Error(`Edge line ${i + 1}: node ${v} is out of range [1, ${n}].`);

    edges.push({
      id: `e${i + 1}`,
      source: String(u),
      target: String(v),
      weight: isNaN(w) ? 1 : w,
    });
  }

  return { nodes, edges };
}
