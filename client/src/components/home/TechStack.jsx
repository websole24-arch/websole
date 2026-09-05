import Reveal from '../common/Reveal';
import useIconParallax from '../../hooks/useIconParallax';
import {
  ReactMark, TailwindMark, FlameMark, JsMark, TsMark, NodeMark, Html5Mark, TriangleMark,
} from './TechMarks';

// Scattered start position (top/left, in %) + size + spin timing + parallax
// depth per badge. `axis` is the (x, y, z) vector each bubble wobbles
// around — mixing axes per icon is what makes them tilt independently
// instead of rotating in unison. `wobble` caps how far each icon tilts
// (kept well under 90deg — a full spin turns a flat icon edge-on and
// collapses it to an invisible sliver, which looks like a glitch, not
// rotation). `dx/dy` is the px path each badge drifts across one loop
// (fades in at the start position, drifts, fades out — see float3d in
// index.css), varied per icon so the field doesn't drift as one flat
// block. `depth` > 1 drifts more under the pointer (feels closer); < 1
// drifts less (feels farther back).
const BADGES = [
  { Mark: FlameMark, top: '38%', left: '42%', size: 52, duration: '7s', delay: '0s', dx: -34, dy: 78, axis: [1, 1, 0], wobble: '20deg', depth: 1.3 },
  { Mark: TailwindMark, top: '34%', left: '61%', size: 48, duration: '8s', delay: '0.4s', dx: 42, dy: 92, axis: [0, 1, 1], wobble: '16deg', depth: 0.7 },
  { Mark: JsMark, top: '55%', left: '61%', size: 56, duration: '6.4s', delay: '0.8s', dx: -22, dy: 104, axis: [1, 0, 1], wobble: '24deg', depth: 1.5 },
  { Mark: NodeMark, top: '56%', left: '76%', size: 46, duration: '9s', delay: '0.2s', dx: 32, dy: 64, axis: [1, 0.4, 0.6], wobble: '14deg', depth: 0.6 },
  { Mark: ReactMark, top: '62%', left: '25%', size: 54, duration: '7.5s', delay: '1.1s', dx: -44, dy: 86, axis: [0.3, 1, 0.5], wobble: '22deg', depth: 1.2 },
  { Mark: TsMark, top: '73%', left: '46%', size: 48, duration: '8.5s', delay: '0.6s', dx: 22, dy: 74, axis: [1, 0.6, 0.2], wobble: '18deg', depth: 0.9 },
  { Mark: Html5Mark, top: '73%', left: '64%', size: 44, duration: '6.8s', delay: '1.4s', dx: -26, dy: 68, axis: [0.5, 0.5, 1], wobble: '16deg', depth: 0.8 },
  { Mark: TriangleMark, top: '78%', left: '35%', size: 22, duration: '8.2s', delay: '0.9s', dx: 16, dy: 52, axis: [1, 1, 1], wobble: '26deg', depth: 0.5 },
];

export default function TechStack() {
  const { containerRef, setIconRef, onMouseMove, onMouseLeave } = useIconParallax();

  return (
    <section className="overflow-hidden border-t border-ink/10 bg-[#12141C] py-20 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-dark">Tech enthusiast</p>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Always excited to build cool stuff with the latest tech.
          </h2>
        </Reveal>

        <div
          ref={containerRef}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          className="relative h-[340px] [perspective:900px] sm:h-[420px]"
        >
          {BADGES.map(({ Mark, top, left, size, duration, delay, dx, dy, axis, wobble, depth }, i) => (
            <div
              key={i}
              ref={setIconRef(i)}
              data-depth={depth}
              className="parallax-icon absolute"
              style={{ top, left }}
            >
              <div
                className="float-icon flex items-center justify-center rounded-2xl border
                           border-white/10 bg-white/5 p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.35)]
                           backdrop-blur-sm [transform-style:preserve-3d]"
                style={{
                  width: size,
                  height: size,
                  '--float-duration': duration,
                  '--float-delay': delay,
                  '--dx': `${dx}px`,
                  '--dy': `${dy}px`,
                  '--wobble': wobble,
                  '--ax': axis[0],
                  '--ay': axis[1],
                  '--az': axis[2],
                }}
              >
                <Mark />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
