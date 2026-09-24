"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { GALLERY_PHOTOS } from "@/lib/gallery";

export function Gallery() {
  const root = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReduced(preference.matches);
    const syncVisibility = () => setHidden(document.hidden);
    syncPreference();
    syncVisibility();
    preference.addEventListener("change", syncPreference);
    document.addEventListener("visibilitychange", syncVisibility);
    const observer = "IntersectionObserver" in window ? new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0 }) : undefined;
    if (root.current) observer?.observe(root.current);
    const fallbackFrame = !observer ? requestAnimationFrame(() => setVisible(true)) : undefined;
    return () => {
      preference.removeEventListener("change", syncPreference);
      document.removeEventListener("visibilitychange", syncVisibility);
      observer?.disconnect();
      if (fallbackFrame !== undefined) cancelAnimationFrame(fallbackFrame);
    };
  }, []);

  useEffect(() => {
    if (!api) return;
    const select = () => setCurrent(api.selectedScrollSnap());
    const startDrag = () => setDragging(true);
    const endDrag = () => setDragging(false);
    select();
    api.on("select", select).on("reInit", select).on("pointerDown", startDrag).on("pointerUp", endDrag);
    return () => { api.off("select", select).off("reInit", select).off("pointerDown", startDrag).off("pointerUp", endDrag); };
  }, [api]);

  useEffect(() => {
    if (!api || !visible || hidden || dragging || GALLERY_PHOTOS.length < 2) return;
    // Reset after each selection or touch, then continue automatically.
    const timer = window.setTimeout(() => {
      if (api.selectedScrollSnap() === api.scrollSnapList().length - 1) api.scrollTo(0, reduced);
      else api.scrollNext(reduced);
    }, 5500);
    return () => window.clearTimeout(timer);
  }, [api, current, visible, hidden, dragging, reduced]);

  function goTo(index: number) { api?.scrollTo(index, reduced); }

  return (
    <div ref={root} className="hm-gallery-carousel" onPointerCancel={() => setDragging(false)}>
      <Carousel opts={{ loop: true, align: "start", duration: 35 }} setApi={setApi} aria-label="Galeri Hairmagic Barbershop">
        <CarouselContent className="hm-gallery-slides">
          {GALLERY_PHOTOS.map((photo, index) => (
            <CarouselItem key={photo.src} className="hm-gallery-slide" aria-label={`Foto ${index + 1} dari ${GALLERY_PHOTOS.length}`} aria-hidden={index !== current}>
              <figure className="hm-gallery-feature">
                <div className="hm-gallery-photo"><Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 58vw, 100vw" style={{ objectPosition: photo.position }} /></div>
                <figcaption><span className="hm-eyebrow">{String(index + 1).padStart(2, "0")} / {photo.category}</span><h3>{photo.title}</h3><p>{photo.description}</p><span className="hm-brand-mark" aria-hidden="true" /></figcaption>
              </figure>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hm-gallery-controls">
          <div className="hm-gallery-pages" aria-label="Pilih foto">
            {GALLERY_PHOTOS.map((photo, index) => <button key={photo.src} type="button" aria-label={`Lihat foto ${index + 1}: ${photo.title}`} aria-current={index === current ? "true" : undefined} onClick={() => goTo(index)}><span /></button>)}
            <span className="hm-gallery-count" aria-hidden="true">{String(current + 1).padStart(2, "0")} / {String(GALLERY_PHOTOS.length).padStart(2, "0")}</span>
          </div>
          <div className="hm-gallery-buttons">
            <button type="button" className="hm-round-control" aria-label="Foto sebelumnya" onClick={() => goTo((current - 1 + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length)}><ArrowLeft aria-hidden="true" /></button>
            <button type="button" className="hm-round-control" aria-label="Foto berikutnya" onClick={() => goTo((current + 1) % GALLERY_PHOTOS.length)}><ArrowRight aria-hidden="true" /></button>
          </div>
        </div>
        <p className="sr-only" aria-live="off">Foto {current + 1} dari {GALLERY_PHOTOS.length}: {GALLERY_PHOTOS[current].title}</p>
      </Carousel>
    </div>
  );
}
