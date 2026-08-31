import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DIMENSIONS, type Dimension, activeDimensionIndex } from "./scene/clusters";
import { scrollState } from "./scene/scrollStore";
import { jumpTo } from "./scene/scrollStore";

gsap.registerPlugin(ScrollTrigger);

type Chapter = {
  eyebrow: string;
  title: string;
  body: string;
  align: "left" | "right" | "center";
  dim: Dimension;
};

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];

const CHAPTERS: Chapter[] = [
  { eyebrow: `${ROMAN[0]}. ${DIMENSIONS[0].name.split("/")[0].trim().toUpperCase()}`, title: "The shard sea", body: "Cold light. No softness.", align: "left", dim: DIMENSIONS[0] },
  { eyebrow: `${ROMAN[1]}. ${DIMENSIONS[1].name.split("/")[0].trim().toUpperCase()}`, title: "The wet nebula", body: "Thoughts stay wet.", align: "right", dim: DIMENSIONS[1] },
  { eyebrow: `${ROMAN[2]}. ${DIMENSIONS[2].name.split("/")[0].trim().toUpperCase()}`, title: "The paper void", body: "No depth. Just map.", align: "left", dim: DIMENSIONS[2] },
  { eyebrow: `${ROMAN[3]}. ${DIMENSIONS[3].name.split("/")[0].trim().toUpperCase()}`, title: "The honeycomb", body: "Order traps.", align: "right", dim: DIMENSIONS[3] },
  { eyebrow: `${ROMAN[4]}. ${DIMENSIONS[4].name.split("/")[0].trim().toUpperCase()}`, title: "The mirror", body: "You become six.", align: "left", dim: DIMENSIONS[4] },
  { eyebrow: `${ROMAN[5]}. ${DIMENSIONS[5].name.split("/")[0].trim().toUpperCase()}`, title: "The wreckage", body: "Not every orbit holds.", align: "right", dim: DIMENSIONS[5] },
  { eyebrow: `${ROMAN[6]}. ${DIMENSIONS[6].name.split("/")[0].trim().toUpperCase()}`, title: "The Singularity", body: "Every fracture, one light.", align: "center", dim: DIMENSIONS[6] },
  { eyebrow: `${ROMAN[7]}. ${DIMENSIONS[7].name.split("/")[0].trim().toUpperCase()}`, title: "The hollow deep", body: "Here light ends. You listen downward.", align: "left", dim: DIMENSIONS[7] },
  { eyebrow: `${ROMAN[8]}. ${DIMENSIONS[8].name.split("/")[0].trim().toUpperCase()}`, title: "The afterlight", body: "The universe exhales. A pale echo remains.", align: "right", dim: DIMENSIONS[8] },
];

function ChapterSection({ chapter, index }: { chapter: Chapter; index: number }) {
  const hex = `#${chapter.dim.color.getHexString()}`;
  const sectionRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const titleWordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const el = sectionRef.current;
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

  const words = chapter.title.split(" ");

  useEffect(() => {
    if (!inView || !sectionRef.current) return;
    const el = sectionRef.current;

    const ctx = gsap.context(() => {
      gsap.fromTo(titleWordRefs.current.filter(Boolean),
        { opacity: 0, y: 28, filter: "blur(8px)" },
        {
          opacity: 1, y: 0, filter: "blur(0)",
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.055,
          scrollTrigger: {
            trigger: el,
            start: "top 70%",
            once: true,
          }
        }
      );

      gsap.fromTo(el.querySelectorAll(".chapter-eyebrow"),
        { opacity: 0, x: chapter.align === "left" ? -20 : 20 },
        { opacity: 1, x: 0, duration: 0.7, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 75%", once: true }
        }
      );

      gsap.fromTo(el.querySelectorAll("p"),
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", delay: 0.3,
          scrollTrigger: { trigger: el, start: "top 75%", once: true }
        }
      );

      if (index === CHAPTERS.length - 1) {
        const cta = el.querySelector(".cta");
        if (cta) {
          gsap.fromTo(cta,
            { opacity: 0, scale: 0.9 },
            { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)",
              scrollTrigger: { trigger: el, start: "top 80%", once: true }
            }
          );
        }
      }
    }, sectionRef);

    return () => { ctx.revert(); };
  }, [inView, chapter, index]);

  useEffect(() => {
    if (!inView) return;
    const detail = { index };
    window.dispatchEvent(new CustomEvent("nexus-chapter-active", { detail }));
  }, [inView, index]);

  return (
      <section
      ref={sectionRef}
      className={`chapter chapter-${chapter.align}`}
      data-index={index}
      data-dim={chapter.dim.key}
      style={{ "--dim-color": hex } as React.CSSProperties}
    >
      <div className="chapter-inner">
        <span className="eyebrow chapter-eyebrow">{chapter.eyebrow}</span>
        <h2>
          {words.map((word, i) => (
            <span key={i} ref={(el) => { titleWordRefs.current[i] = el; }} className="title-word">
              {word}{" "}
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

function DimensionTracker() {
  const trackerRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const tracker = trackerRef.current;
    if (!tracker) return;

    let raf = 0;
    const tick = () => {
      const idx = activeDimensionIndex(scrollState.current);
      const dim = DIMENSIONS[idx];
      const ch = Math.min(8, Math.floor(idx));
      if (numRef.current) numRef.current.textContent = ROMAN[ch] || ROMAN[0];
      if (nameRef.current) nameRef.current.textContent = dim.name.split("/")[0].trim().toUpperCase();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const onScroll = () => setVisible(scrollState.current > 0.05);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={trackerRef} className={`dim-tracker ${visible ? "visible" : ""}`}>
      <span ref={numRef} className="dim-tracker-num">I</span>
      <span className="dim-tracker-divider" />
      <span ref={nameRef} className="dim-tracker-name">GLASS</span>
    </div>
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

function HeroScrollHint() {
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = hintRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.to(el, {
        y: 8,
        opacity: 1,
        duration: 2.4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div ref={hintRef} className="scroll-hint">↓ TEAR OPEN REALITY</div>
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
        <HeroScrollHint />
      </header>

      <SprocketProgress />

      <DimensionTracker />

      {CHAPTERS.map((chapter, i) => (
        <ChapterSection chapter={chapter} index={i} key={chapter.title} />
      ))}

      <footer className="credits">
        <p>Real-time film VFX built with React Three Fiber, hand-written GLSL, and GSAP-grade easing.</p>
      </footer>
    </div>
  );
}