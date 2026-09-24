"use client";

import { useEffect, useRef } from "react";

export function BrandFilm() {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    // Set both the attribute and property before requesting muted inline playback.
    video.defaultMuted = true;
    video.muted = true;
    let inView = !("IntersectionObserver" in window);
    const sync = () => {
      if (inView && !document.hidden) {
        if (video.paused) void video.play().catch(() => {});
      }
      else video.pause();
    };
    const observer = "IntersectionObserver" in window ? new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    }, { threshold: 0 }) : undefined;
    observer?.observe(video);
    sync();
    video.addEventListener("canplay", sync);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pageshow", sync);
    // If the browser requires a gesture, retry during normal page interaction.
    document.addEventListener("touchend", sync, { passive: true });
    document.addEventListener("pointerup", sync, { passive: true });
    document.addEventListener("keydown", sync);
    return () => {
      observer?.disconnect();
      video.removeEventListener("canplay", sync);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pageshow", sync);
      document.removeEventListener("touchend", sync);
      document.removeEventListener("pointerup", sync);
      document.removeEventListener("keydown", sync);
      video.pause();
    };
  }, []);
  return (
    <div className="hm-film-composition">
      <div className="hm-film-frame">
        <div className="hm-film">
          <video ref={ref} autoPlay muted loop playsInline controls={false} preload="auto" poster="/media/hairmagic-film-poster.webp" aria-label="Suasana Hairmagic Barbershop">
            <source src="/media/hairmagic-film.mp4" type="video/mp4" />
          </video>
          <div className="hm-film-top"><span>THE HAIRMAGIC EXPERIENCE</span><span className="hm-film-edition">01</span></div>
          <div className="hm-film-bottom">
            <div><span>HAIRCUTS & SHAVES</span><strong>Di sinilah magic-nya.</strong></div>
          </div>
        </div>
      </div>
      <div className="hm-film-caption"><span>YOUR HAIR. OUR MAGIC.</span><span className="hm-brand-mark" aria-hidden="true" /></div>
    </div>
  );
}
