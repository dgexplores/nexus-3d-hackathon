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
  { eyebrow: `${ROMAN[0]}. ${DIMENSIONS[0].name.split("/")[0].trim().toUpperCase()}`, title: "The shard sea", body: "Cold light. No softness.", align: "left", dim: DIMENSIONS[0] },
  { eyebrow: `${ROMAN[1]}. ${DIMENSIONS[1].name.split("/")[0].trim().toUpperCase()}`, title: "The wet nebula", body: "Thoughts stay wet.", align: "right", dim: DIMENSIONS[1] },
  { eyebrow: `${ROMAN[2]}. ${DIMENSIONS[2].name.split("/")[0].trim().toUpperCase()}`, title: "The paper void", body: "No depth. Just map.", align: "left", dim: DIMENSIONS[2] },
  { eyebrow: `${ROMAN[3]}. ${DIMENSIONS[3].name.split("/")[0].trim().toUpperCase()}`, title: "The honeycomb", body: "Order traps.", align: "right", dim: DIMENSIONS[3] },
  { eyebrow: `${ROMAN[4]}. ${DIMENSIONS[4].name.split("/")[0].trim().toUpperCase()}`, title: "The mirror", body: "You become six.", align: "left", dim: DIMENSIONS[4] },
  { eyebrow: `${ROMAN[5]}. ${DIMENSIONS[5].name.split("/")[0].trim().toUpperCase()}`, title: "The wreckage", body: "Not every orbit holds.", align: "right", dim: DIMENSIONS[5] },
  { eyebrow: `${ROMAN[6]}. ${DIMENSIONS[6].name.split("/")[0].trim().toUpperCase()}`, title: "One sky", body: "All masks, one sky.", align: "center", dim: DIMENSIONS[6] },
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
        <span className="hero-eyebrow gsap-in">DIMENSIONAL GATEWAY // ALPHA-9</span>
        <h1 className="hero-title gsap-in">THE MULTIVERSE</h1>
        <div className="hero-thread gsap-in" aria-hidden="true">
          <span className="hero-thread-line" />
          <span className="hero-thread-dot" />
          <span className="hero-thread-label">NEXUS — one thread you forgot you were holding</span>
        </div>
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
