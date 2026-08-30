import { useEffect, useRef, useState } from "react";
import { DIMENSIONS, type Dimension } from "./scene/clusters";

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
    eyebrow: `${ROMAN[0]}. ${DIMENSIONS[0].name}`,
    title: "Every edge here\nremembers the light.",
    body: "A universe of cut faces and cold precision, Dutch-tilted and telephoto-close, as if Gargantua's gravity had a shape. Nothing is soft. Nothing forgives.",
    align: "left",
    dim: DIMENSIONS[0],
  },
  {
    eyebrow: `${ROMAN[1]}. ${DIMENSIONS[1].name}`,
    title: "Here, thought\nnever dries.",
    body: "Viscous, warm, smeared across the frame like wet oil under macro glass. The camera lags a beat behind, drunk on its own colour.",
    align: "right",
    dim: DIMENSIONS[1],
  },
  {
    eyebrow: `${ROMAN[2]}. ${DIMENSIONS[2].name}`,
    title: "Flatten a mind\nand it becomes a map.",
    body: "Top-down, monochrome, cross-hatched like a page torn from someone else's notebook. No depth. No mercy. Just line and void.",
    align: "left",
    dim: DIMENSIONS[2],
  },
  {
    eyebrow: `${ROMAN[3]}. ${DIMENSIONS[3].name}`,
    title: "Order, taken\ntoo far, traps you.",
    body: "A honeycomb of impossible geometry, fisheye-bent, rolling a full circle around itself. Grid-locked and claustrophobic, the way certainty always is.",
    align: "right",
    dim: DIMENSIONS[3],
  },
  {
    eyebrow: `${ROMAN[4]}. ${DIMENSIONS[4].name}`,
    title: "Look long enough\nand you multiply.",
    body: "Six-fold recursion, a vertigo dolly pulling back as the lens pushes in. Doctor Strange's kaleidoscope, minus the mercy of an exit.",
    align: "left",
    dim: DIMENSIONS[4],
  },
  {
    eyebrow: `${ROMAN[5]}. ${DIMENSIONS[5].name}`,
    title: "Some universes\ndon't survive contact.",
    body: "Handheld, stuttering at twenty-four frames, wreckage tumbling in zero gravity. This is what's left after a divergence goes wrong.",
    align: "right",
    dim: DIMENSIONS[5],
  },
  {
    eyebrow: `${ROMAN[6]}. ${DIMENSIONS[6].name}`,
    title: "Zoom out far enough,\nand it's one mind.",
    body: "Every skin from every dimension, layered translucent and rising to a god's-eye crane shot. The wormhole was never a door. It was the shape of the connection itself.",
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
          <span
            key={dim.id}
            className={`sprocket-hole ${i === active ? "sprocket-active" : ""}`}
            style={{ "--dim-color": hex } as React.CSSProperties}
            title={dim.name}
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
        <span className="eyebrow gsap-in">Seven realities • One wormhole • 60FPS WebGL</span>
        <h1 className="gsap-in">
          <i>Jumping</i> through<br />
          <span className="grad">minds.</span>
        </h1>
        <div className="gsap-in" style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", letterSpacing: "-0.02em", opacity: 0.92, marginTop: "0.2rem" }}>NEXUS</div>
        <p className="hero-sub gsap-in">
          A Strange-grade scroll dive — Glass, Paint, Ink, Cube, Mirror, Debris and Fractal. <strong>PeachWeb landing craft</strong> meets multiverse warps.
        </p>
        <div className="hero-ctas gsap-in">
          <a href="#top" className="btn-primary">
            Start dive <span>→</span>
          </a>
          <a href="#top" className="btn-ghost">
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "#fff", display: "inline-block" }} /> Watch 45s
          </a>
        </div>
        <p className="scroll-hint gsap-in">Scroll to cross into another universe ↓</p>
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
