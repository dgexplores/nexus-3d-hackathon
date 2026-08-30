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
    body: "Dutch 12° • 38mm tele • time 0.55× — 14 chrome shards catch the blue galaxy behind. Cold light, no softness.",
    align: "left",
    dim: DIMENSIONS[0],
  },
  {
    eyebrow: `${ROMAN[1]}. ${DIMENSIONS[1].name}`,
    title: "The wet nebula",
    body: "82mm macro • -6° dutch • time 0.32× syrup — 13 paint nodes drag 0.3s, pink galaxy smears.",
    align: "right",
    dim: DIMENSIONS[1],
  },
  {
    eyebrow: `${ROMAN[2]}. ${DIMENSIONS[2].name}`,
    title: "The paper void",
    body: "14mm orthographic top-down • time 0.45× — 15 papers flat under white dwarf. No depth, just map.",
    align: "left",
    dim: DIMENSIONS[2],
  },
  {
    eyebrow: `${ROMAN[3]}. ${DIMENSIONS[3].name}`,
    title: "The honeycomb",
    body: "18mm fisheye • roll 180° • time 0.68× — 14 cubes snap to 0.35 ly grid, amber rings watch.",
    align: "right",
    dim: DIMENSIONS[3],
  },
  {
    eyebrow: `${ROMAN[4]}. ${DIMENSIONS[4].name}`,
    title: "The mirror",
    body: "58mm vertigo dolly • 3° • time 0.52× — 7 → 28 mirrored, purple galaxy echo. You become six.",
    align: "left",
    dim: DIMENSIONS[4],
  },
  {
    eyebrow: `${ROMAN[5]}. ${DIMENSIONS[5].name}`,
    title: "The wreckage",
    body: "50mm handheld • 5° shake • time 1.7× stutter 24fps — 13 tets drift past mint planet.",
    align: "right",
    dim: DIMENSIONS[5],
  },
  {
    eyebrow: `${ROMAN[6]}. ${DIMENSIONS[6].name}`,
    title: "One sky",
    body: "28mm crane 11 ly up • time 0.95× — all 7 galaxies + thread + double torus in one blowout.",
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
    glass: "LENS 38mm TELE • ROLL 12° • TIME 0.55× • 14 shards",
    paint: "LENS 82mm MACRO • ROLL -6° • TIME 0.32× • 13 paint",
    ink: "LENS 14mm ORTHO • ROLL 0° • TIME 0.45× • 15 paper",
    cube: "LENS 18mm FISHEYE • ROLL 180° • TIME 0.68× • 14 cubes",
    mirror: "LENS 58mm VERTIGO • ROLL 3° • TIME 0.52× • 28 mirror",
    debris: "LENS 50mm HANDHELD • ROLL 5° • TIME 1.7× • 13 debris",
    fractal: "LENS 28mm CRANE • ROLL 0° • TIME 0.95× • all skies",
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
