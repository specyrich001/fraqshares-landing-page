import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import './artboard.css'

/**
 * Mobile only (below 1024px): shows its one child — a visual built at its desktop size, `width` ×
 * `height` — scaled to fit this box's width (never up), so overlay positions and px-based
 * micro-animations work unchanged. The box takes the scaled height. From 1024px up it is
 * display: contents, as if it weren't there.
 *
 * The child must keep its native size on mobile (no max-width: 100% there).
 */
export function ScaledArtboard({ width, height, className = '', children }: { width: number; height: number; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current!
    // A display: contents box reports 0 and is ignored.
    const fit = (w: number) => w > 0 && el.style.setProperty('--artboard-scale', String(Math.min(1, w / width)))
    // Now, so the page has its final height before the sections' ScrollTriggers measure it (their
    // layout effects run after this one; the observer's first call comes too late for them).
    fit(el.clientWidth)
    // Then on every resize.
    const ro = new ResizeObserver(([entry]) => fit(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [width])

  return (
    <div ref={ref} data-artboard className={className} style={{ '--artboard-w': `${width}px`, '--artboard-h': height } as CSSProperties}>
      {children}
    </div>
  )
}
