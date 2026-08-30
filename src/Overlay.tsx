import { useEffect, useRef } from "react";

type Chapter = {
  eyebrow: string;
  title: string;
  body: string;
  align: "left" | "right" | "center";
};

const CHAPTERS: Chapter[] = [
  {
    eyebrow: "I. Ignition",
    title: "Every mind is\na universe of its own.",
    body: "A cluster of thought, pulsing in the dark, one node among thousands, tethered back to something larger than itself.",
    align: "left",
  },
  {
    eyebrow: "II. Divergence",
    title: "Somewhere, another\nyou decided differently.",
    body: "Follow the synapse and it doesn't lead backward. It leads sideways, into a reality that split from this one.",
    align: "right",
  },
  {
    eyebrow: "III. Convergence",
    title: "All roads lead\nback to the nexus.",
    body: "However far a universe drifts, it stays wired to the same singular point of origin, the wormhole at the center of it all.",
    align: "left",
  },
  {
    eyebrow: "IV. Singularity",
    title: "Zoom out far enough,\nand it's one mind.",
    body: "The wormhole was never a door between worlds. It was the shape of the connection itself.",
    align: "center",
  },
];

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        el.classList.toggle("in-view", entry.isIntersecting);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

function ChapterSection({ chapter, index }: { chapter: Chapter; index: number }) {
  const ref = useInView<HTMLElement>();
  return (
    <section ref={ref} className={`chapter chapter-${chapter.align}`} data-index={index}>
      <div className="chapter-inner">
        <span className="eyebrow">{chapter.eyebrow}</span>
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

export function Overlay() {
  return (
    <div className="overlay">
      <header className="hero">
        <span className="eyebrow gsap-in">A wormhole between minds</span>
        <h1 className="gsap-in">NEXUS</h1>
        <p className="scroll-hint gsap-in">Scroll to cross into another universe ↓</p>
      </header>

      {CHAPTERS.map((chapter, i) => (
        <ChapterSection chapter={chapter} index={i} key={chapter.title} />
      ))}

      <footer className="credits">
        <p>Built with React Three Fiber, custom GLSL shaders, and GSAP-grade easing.</p>
      </footer>
    </div>
  );
}
