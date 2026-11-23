import { T } from "./tokens.js";

// Shared drag-and-drop handle: a 2 × 3 dot grip, used by every reorderable list.
export default function GripIcon({ color = T.gray400 }) {
  return (
    <svg width="14" height="18" viewBox="0 0 14 18" fill={color} aria-hidden="true">
      {[4, 9, 14].flatMap((y) => [4, 10].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />))}
    </svg>
  );
}
