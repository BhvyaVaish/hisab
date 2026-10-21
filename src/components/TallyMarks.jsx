// src/components/TallyMarks.jsx
// Visual-only tally counter. Session state only – not persisted.
// Strokes 1-4 are vertical. Stroke 5 is a diagonal gate across the four.
// Resets visually after the 5th stroke (stored stock is never affected).

import './TallyMarks.css';

const VERTICAL_COORDS = [
  { x1: 9,  y1: 7,  x2: 10, y2: 31 },
  { x1: 18, y1: 6,  x2: 17, y2: 32 },
  { x1: 27, y1: 7,  x2: 28, y2: 31 },
  { x1: 36, y1: 6,  x2: 35, y2: 32 },
];

/**
 * @param {{ count: number }} props
 *   count: 0-5. 0 = empty. 5 shows four verticals + diagonal gate.
 */
export default function TallyMarks({ count }) {
  if (count <= 0) return <div className="tally-container" aria-hidden="true" />;

  const numV = Math.min(count, 4);

  return (
    <div className="tally-container" aria-hidden="true">
      <svg
        className="tally-svg"
        viewBox="0 0 46 38"
        width="48"
        height="36"
        style={{ overflow: 'visible' }}
      >
        {Array.from({ length: numV }, (_, i) => {
          const c     = VERTICAL_COORDS[i];
          const isNew = i === count - 1 && count <= 4;
          return (
            <line
              key={i}
              className={`tally-line${isNew ? ' tally-anim-v' : ''}`}
              x1={c.x1} y1={c.y1}
              x2={c.x2} y2={c.y2}
            />
          );
        })}
        {count >= 5 && (
          <line
            className="tally-line tally-anim-diag"
            x1="5" y1="29" x2="41" y2="9"
          />
        )}
      </svg>
    </div>
  );
}
