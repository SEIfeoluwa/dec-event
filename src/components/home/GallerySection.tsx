import { useEffect, useRef } from 'react'
import tealGown from '../../assets/gallery-1.jpg'
import pinkBlouse from '../../assets/gallery-2.jpg'
import blueGown from '../../assets/gallery-4.jpg'
import whiteLaceSuit from '../../assets/gallery-7.jpg'
import burgundyAsoOke from '../../assets/gallery-8.jpg'
import orangeSuit from '../../assets/gallery-9.jpg'

// One photo per outfit: no outfit should appear twice in the gallery.
const galleryImages = [
  { src: tealGown, alt: 'Pastor Mrs Adebisi in a teal pleated gown' },
  { src: whiteLaceSuit, alt: 'Pastor and Pastor Mrs Adebisi, she in a white lace suit' },
  { src: pinkBlouse, alt: 'Pastor Mrs Adebisi in a pink striped blouse, seated at a table' },
  { src: burgundyAsoOke, alt: 'Pastor and Pastor Mrs Adebisi in traditional attire, she in burgundy with a matching gele' },
  { src: blueGown, alt: 'Pastor Mrs Adebisi in a royal blue gown, seated on a tufted chair' },
  { src: orangeSuit, alt: 'Pastor Mrs Adebisi in an orange skirt suit' },
]

const LOOP_SECONDS = 60
const RESUME_DELAY_MS = 2000

export default function Gallery() {
  const marqueeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const marquee = marqueeRef.current
    if (!marquee || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Browsers may round scrollLeft, so the exact position is tracked here.
    // Starting just past 0 lets visitors scroll backwards straight away.
    let position = 1
    let pausedUntil = 0
    let isHovering = false
    let dragX: number | null = null
    let previousTime = performance.now()
    let frame: number

    // The track holds two copies of the photos; jumping by half its width
    // lands on an identical view, so the loop is seamless in both directions.
    const wrap = () => {
      const loopWidth = marquee.scrollWidth / 2
      if (position >= loopWidth) position -= loopWidth
      else if (position <= 0) position += loopWidth
      else return false
      return true
    }

    const tick = (time: number) => {
      const elapsed = Math.min(time - previousTime, 50)
      previousTime = time
      if (!isHovering && dragX === null && time >= pausedUntil) {
        position += ((marquee.scrollWidth / 2) * elapsed) / (LOOP_SECONDS * 1000)
        wrap()
        marquee.scrollLeft = position
      }
      frame = requestAnimationFrame(tick)
    }

    // A scrollLeft that differs from ours means the visitor moved the strip.
    const onScroll = () => {
      if (Math.abs(marquee.scrollLeft - position) <= 2) return
      pausedUntil = performance.now() + RESUME_DELAY_MS
      position = marquee.scrollLeft
      if (wrap()) marquee.scrollLeft = position
    }

    const onPointerEnter = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') isHovering = true
    }
    const onPointerLeave = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') isHovering = false
    }

    // Touch and trackpads scroll natively; a mouse needs click-and-drag.
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return
      dragX = event.clientX
      marquee.setPointerCapture(event.pointerId)
      marquee.classList.add('is-dragging')
    }
    const onPointerMove = (event: PointerEvent) => {
      if (dragX === null) return
      marquee.scrollLeft -= event.clientX - dragX
      dragX = event.clientX
    }
    const onPointerUp = () => {
      if (dragX === null) return
      dragX = null
      pausedUntil = performance.now() + RESUME_DELAY_MS
      marquee.classList.remove('is-dragging')
    }

    marquee.scrollLeft = position
    marquee.addEventListener('scroll', onScroll, { passive: true })
    marquee.addEventListener('pointerenter', onPointerEnter)
    marquee.addEventListener('pointerleave', onPointerLeave)
    marquee.addEventListener('pointerdown', onPointerDown)
    marquee.addEventListener('pointermove', onPointerMove)
    marquee.addEventListener('pointerup', onPointerUp)
    marquee.addEventListener('pointercancel', onPointerUp)
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      marquee.removeEventListener('scroll', onScroll)
      marquee.removeEventListener('pointerenter', onPointerEnter)
      marquee.removeEventListener('pointerleave', onPointerLeave)
      marquee.removeEventListener('pointerdown', onPointerDown)
      marquee.removeEventListener('pointermove', onPointerMove)
      marquee.removeEventListener('pointerup', onPointerUp)
      marquee.removeEventListener('pointercancel', onPointerUp)
    }
  }, [])

  return (
    <section className="gallery">
      <h2>Gallery</h2>
      <div
        className="gallery-marquee"
        ref={marqueeRef}
        role="region"
        aria-label="Photo gallery"
        tabIndex={0}
      >
        {/* The photos are rendered twice so the strip can loop seamlessly;
            the second copy is hidden from screen readers. */}
        <div className="gallery-track">
          {[...galleryImages, ...galleryImages].map((image, index) => {
            const isCopy = index >= galleryImages.length
            return (
              <img
                key={index}
                src={image.src}
                alt={isCopy ? '' : image.alt}
                aria-hidden={isCopy || undefined}
                decoding="async"
                draggable={false}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
