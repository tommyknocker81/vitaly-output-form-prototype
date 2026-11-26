// Placeholder values for previews (agenda columns, Past MDTs fields).
// Rule: previews never show realistic clinical data, only lorem ipsum.
const WORDS =
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat".split(" ");

// Seeded by field type: fields of one type always show the same placeholder.
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

// One placeholder per field type: every Text field reads "Eiusmod magna dolores", every
// Text area the same paragraph, and each other type its own three words.
export const LOREM_PARAGRAPH =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua";

const BY_TYPE = { Text: "Eiusmod magna dolores", String: "Eiusmod magna dolores", "Text area": LOREM_PARAGRAPH };

export const previewValue = (field) => BY_TYPE[field?.type] ?? lorem(`type:${field?.type ?? ""}`, 3, 3);
