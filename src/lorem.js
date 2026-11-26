// Placeholder values for previews (agenda columns, Past MDTs fields).
// Rule: previews never show realistic clinical data, only lorem ipsum.
const WORDS =
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat".split(" ");

// Seeded by field key: the same field always shows the same placeholder, in every row.
function hash(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

// Different fields never share a placeholder, so columns stay easy to tell apart.
const cache = new Map();
const taken = new Set();

export function lorem(seed, min = 1, max = 3) {
  const id = `${seed}|${min}|${max}`;
  if (cache.has(id)) return cache.get(id);
  const h = hash(seed);
  const n = min + (h % (max - min + 1));
  let start = (h >>> 8) % WORDS.length;
  let text;
  for (let tries = 0; tries < WORDS.length; tries++, start = (start + 1) % WORDS.length) {
    const words = Array.from({ length: n }, (_, i) => WORDS[(start + i * 7) % WORDS.length]);
    text = words.join(" ");
    text = text.charAt(0).toUpperCase() + text.slice(1) + (n > 4 ? "." : "");
    if (!taken.has(text)) break;
  }
  taken.add(text);
  cache.set(id, text);
  return text;
}

// Every Text area field shows the same paragraph; other types get a short three-word placeholder.
export const LOREM_PARAGRAPH =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua";

export const previewValue = (field) => (field?.type === "Text area" ? LOREM_PARAGRAPH : lorem(field?.key ?? "", 3, 3));
