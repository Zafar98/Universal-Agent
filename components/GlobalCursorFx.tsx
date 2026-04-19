"use client";

import { useEffect, useRef } from "react";

export function GlobalCursorFx() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let ringX = window.innerWidth / 2;
    let ringY = window.innerHeight / 2;
    let targetX = ringX;
    let targetY = ringY;
    let raf = 0;

    const onMove = (event: MouseEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      dot.style.transform = `translate(${targetX}px, ${targetY}px)`;
    };

    const tick = () => {
      ringX += (targetX - ringX) * 0.12;
      ringY += (targetY - ringY) * 0.12;
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
      raf = window.requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="ua-cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="ua-cursor-dot" aria-hidden="true" />
    </>
  );
}
