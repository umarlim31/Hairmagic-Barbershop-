"use client";

import { useEffect } from "react";

/** Progressive enhancement: all content stays visible without JavaScript. */
export function PageMotion() {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    let observer: IntersectionObserver | undefined;

    const show = (element: HTMLElement) => {
      element.dataset.revealState = "visible";
      observer?.unobserve(element);
    };
    const configure = () => {
      observer?.disconnect();
      if (preference.matches || !("IntersectionObserver" in window)) {
        elements.forEach(show);
        return;
      }
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) show(entry.target as HTMLElement);
        });
      }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });
      elements.forEach(element => {
        // Leave the first screen and visited content visible; animate upcoming content once.
        if (element.dataset.revealState === "visible" || element.getBoundingClientRect().top < window.innerHeight) show(element);
        else {
          element.dataset.revealState = "pending";
          observer?.observe(element);
        }
      });
    };
    const revealFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const region = event.target.closest<HTMLElement>("[data-reveal]");
      if (region) show(region);
    };

    configure();
    preference.addEventListener("change", configure);
    document.addEventListener("focusin", revealFocus);
    return () => {
      observer?.disconnect();
      preference.removeEventListener("change", configure);
      document.removeEventListener("focusin", revealFocus);
      elements.forEach(element => delete element.dataset.revealState);
    };
  }, []);

  return null;
}
