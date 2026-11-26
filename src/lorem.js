// Placeholder values for previews (agenda columns, Past MDTs fields).
// Rule: previews never show realistic clinical data, only lorem ipsum.
const WORDS =
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat".split(" ");

// Stable for a given seed, so a value doesn't change between renders.
function hash(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function lorem(seed, min = 1, max = 3) {
  const h = hash(seed);
  const n = min + (h % (max - min + 1));
  const start = (h >>> 8) % WORDS.length;
  const words = Array.from({ length: n }, (_, i) => WORDS[(start + i * 7) % WORDS.length]);
  const text = words.join(" ");
  return text.charAt(0).toUpperCase() + text.slice(1) + (n > 4 ? "." : "");
}
