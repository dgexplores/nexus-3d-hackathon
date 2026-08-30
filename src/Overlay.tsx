import { useEffect, useRef, useState } from "react";
import { DIMENSIONS, type Dimension } from "./scene/clusters";
import { jumpTo } from "./scene/scrollStore";

type Chapter = {
  eyebrow: string;
  title: string;
  body: string;
  align: "left" | "right" | "center";
  dim: Dimension;
};

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

const CHAPTERS: Chapter[] = [
  {
    eyebrow: `${ROMAN[0]}. ${DIMENSIONS[0].name}  •  14 shards  •  blue giant behind`,
    title: "The shard sea\ncatches every photon.",
    body: "You’re inside 14 glass facets orbiting the blue galaxy. Light fractures cold — Dutch 12° telephoto — the way starlight does through ice. Precision feels beautiful until you notice nothing here can soften.",
    align: "left",
    dim: DIMENSIONS[0],
  },
  {
    eyebrow: `${ROMAN[1]}. ${DIMENSIONS[1].name}  •  viscous nebula  •  1.4 ly smear`,
    title: "This nebula\nnever dries.",
    body: "Warm oil-slick colour bleeds across the lens. 13 nodes float in syrup, the camera drags 0.3s behind like you’re swimming. The pink galaxy behind swirls — thoughts here stay wet, unfinished, human.",
    align: "right",
    dim: DIMENSIONS[1],
  },
  {
    eyebrow: `${ROMAN[2]}. ${DIMENSIONS[2].name}  •  flat paper void  •  white dwarf above`,
    title: "A mind flattened\nto be read.",
    body: "Top-down orthographic, no depth, just ink on void. 15 nodes lie like constellations on paper under a white dwarf. We flatten worlds to map them — and lose the air that let them breathe.",
    align: "left",
    dim: DIMENSIONS[2],
  },
  {
    eyebrow: `${ROMAN[3]}. ${DIMENSIONS[3].name}  •  honeycomb lattice  •  amber planet rings`,
    title: "A perfect grid\nthat became a cage.",
    body: "Amber planet with rings watches over a honeycomb. Fisheye 18mm bends the horizon 180°. Every node snaps to 0.35 ly grid — order so complete it can’t imagine anything else. That’s why it traps.",
    align: "right",
    dim: DIMENSIONS[3],
  },
  {
    eyebrow: `${ROMAN[4]}. ${DIMENSIONS[4].name}  •  kaleido echo  •  6× recursion`,
    title: "Stare and\nyou become six.",
    body: "The mirror galaxy duplicates you — 7 nodes mirrored to 28. Vertigo dolly pulls back while lens pushes in. Space itself is a hall of mirrors; every choice you see is you, again.",
    align: "left",
    dim: DIMENSIONS[4],
  },
  {
    eyebrow: `${ROMAN[5]}. ${DIMENSIONS[5].name}  •  debris field  •  0-G wreckage`,
    title: "Not every orbit\nholds.",
    body: "Handheld 24fps, dust and wreckage tumbling past the mint planet. 13 nodes drift 1.8 ly wide — this is after a gravity shear. Some environments don’t survive contact. You feel the empty air.",
    align: "right",
    dim: DIMENSIONS[5],
  },
  {
    eyebrow: `${ROMAN[6]}. ${DIMENSIONS[6].name}  •  all skies at once  •  god view`,
    title: "Pull back —\none sky holds all.",
    body: "Crane to 11 ly up: four galaxies, two nebulae, the thread, and the wormhole’s double rings — all in one frame. The white core blows out. It was never doors between worlds. It was one sky wearing masks.",
    align: "center",
    dim: DIMENSIONS[6],
  },
];

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        el.classList.toggle("in-view", entry.isIntersecting);
        setInView(entry.isIntersecting);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}

function ChapterSection({ chapter, index }: { chapter: Chapter; index: number }) {
  const { ref, inView } = useInView<HTMLElement>();
  const hex = `#${chapter.dim.color.getHexString()}`;

  useEffect(() => {
    if (!inView) return;
    const detail = { index };
    window.dispatchEvent(new CustomEvent("nexus-chapter-active", { detail }));
  }, [inView, index]);

  return (
    <section
      ref={ref}
      className={`chapter chapter-${chapter.align}`}
      data-index={index}
      data-dim={chapter.dim.key}
      style={{ "--dim-color": hex } as React.CSSProperties}
    >
      <div className="chapter-inner">
        <span className="eyebrow chapter-eyebrow">{chapter.eyebrow}</span>
        <h2>
          {chapter.title.split("\n").map((line) => (
            <span className="line" key={line}>
              {line}
            </span>
          ))}
        </h2>
        <p>{chapter.body}</p>
        {index === CHAPTERS.length - 1 && (
          <a className="cta magnetic" href="#top">
            Return to universe zero
          </a>
        )}
      </div>
    </section>
  );
}

function SprocketProgress() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onActive = (e: Event) => {
      const custom = e as CustomEvent<{ index: number }>;
      setActive(custom.detail.index);
    };
    window.addEventListener("nexus-chapter-active", onActive);
    return () => window.removeEventListener("nexus-chapter-active", onActive);
  }, []);

  return (
    <nav className="sprocket-rail" aria-label="Dimension progress">
      {DIMENSIONS.map((dim, i) => {
        const hex = `#${dim.color.getHexString()}`;
        return (
          <button
            key={dim.id}
            onClick={() => jumpTo(dim.scrollPeak)}
            className={`sprocket-hole ${i === active ? "sprocket-active" : ""}`}
            style={{ "--dim-color": hex } as React.CSSProperties}
            title={`${dim.name} — click to jump`}
            aria-label={`Jump to ${dim.name}`}
          />
        );
      })}
    </nav>
  );
}

export function Overlay() {
  return (
    <div className="overlay">
      <header className="hero">
        <span className="hero-eyebrow gsap-in">Dimensional Gateway // Alpha-9</span>
        <h1 className="hero-title gsap-in">THE MULTIVERSE</h1>
        <div className="hero-thread gsap-in" aria-hidden="true">
          <span className="hero-thread-line" />
          <span className="hero-thread-dot" />
          <span className="hero-thread-label">NEXUS — a thread you forgot you were holding</span>
        </div>
        <p className="hero-sub gsap-in">Scroll to breach the timeline barrier and traverse seven alternative realities.</p>
        <p className="scroll-hint gsap-in">↓ TEAR OPEN REALITY</p>
      </header>

      <SprocketProgress />

      {CHAPTERS.map((chapter, i) => (
        <ChapterSection chapter={chapter} index={i} key={chapter.title} />
      ))}

      <footer className="credits">
        <p>Real-time film VFX built with React Three Fiber, hand-written GLSL, and GSAP-grade easing.</p>
      </footer>
    </div>
  );
}
