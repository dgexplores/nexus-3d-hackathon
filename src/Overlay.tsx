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
    eyebrow: `${ROMAN[0]}. ${DIMENSIONS[0].name}`,
    title: "The shard sea",
    body: "14 facets • blue galaxy 6.5 ly behind — light fractures cold.",
    align: "left",
    dim: DIMENSIONS[0],
  },
  {
    eyebrow: `${ROMAN[1]}. ${DIMENSIONS[1].name}`,
    title: "The wet nebula",
    body: "13 nodes in pink smear • time 0.32× slow — thoughts stay wet.",
    align: "right",
    dim: DIMENSIONS[1],
  },
  {
    eyebrow: `${ROMAN[2]}. ${DIMENSIONS[2].name}`,
    title: "The paper void",
    body: "15 nodes flat • white dwarf above — no depth, just map.",
    align: "left",
    dim: DIMENSIONS[2],
  },
  {
    eyebrow: `${ROMAN[3]}. ${DIMENSIONS[3].name}`,
    title: "The honeycomb",
    body: "14 nodes grid 0.35 ly • amber rings behind — order traps.",
    align: "right",
    dim: DIMENSIONS[3],
  },
  {
    eyebrow: `${ROMAN[4]}. ${DIMENSIONS[4].name}`,
    title: "The mirror",
    body: "7 → 28 mirrored • purple galaxy 6 ly — you become six.",
    align: "left",
    dim: DIMENSIONS[4],
  },
  {
    eyebrow: `${ROMAN[5]}. ${DIMENSIONS[5].name}`,
    title: "The wreckage",
    body: "13 nodes drift 1.8 ly • mint planet • 24fps — not every orbit holds.",
    align: "right",
    dim: DIMENSIONS[5],
  },
  {
    eyebrow: `${ROMAN[6]}. ${DIMENSIONS[6].name}`,
    title: "One sky",
    body: "All galaxies in one frame 11 ly up — one sky wearing masks.",
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
  const galaxyData: Record<string, string> = {
    glass: "1800 stars • 2 arms • 2.2 ly",
    paint: "1500 stars • 2 arms • 2.0 ly",
    ink: "1400 stars • 2 arms • 1.6 ly",
    cube: "1600 stars • 3 arms • 1.9 ly",
    mirror: "1700 stars • 2 arms • 2.1 ly",
    debris: "1400 stars • 2 arms • 1.6 ly",
    fractal: "2000 stars • 3 arms • 2.4 ly",
  };

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
        <span className="chapter-meta">{galaxyData[chapter.dim.key] ?? ""}</span>
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
