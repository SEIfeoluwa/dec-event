import heroImg from '../../assets/hero.jpg'

interface HeroProps {
  onRsvpClick: () => void
}

/*
 * Intro sequence (timings live in App.css):
 *   1. Photo settles in, untinted, so the celebrant is seen clearly.
 *   2. "Please join us in celebrating" fades in above her head.
 *   3. The blue tint fades in while the name, details and button rise up.
 */
export default function Hero({ onRsvpClick }: HeroProps) {
  return (
    <section className="hero">
      <div
        className="hero-photo"
        style={{ backgroundImage: `url(${heroImg})` }}
        role="img"
        aria-label="Pastor Mrs Adebisi in a royal blue gown"
      />
      <div className="hero-tint" aria-hidden="true" />

      <div className="hero-content">
        <p className="hero-eyebrow">Please join us in celebrating</p>

        <div className="hero-main">
          <h1 className="hero-rise" style={{ '--rise-order': 0 } as React.CSSProperties}>
            Pastor Mrs Adebisi
          </h1>
          <p className="hero-ages hero-rise" style={{ '--rise-order': 1 } as React.CSSProperties}>
            Celebrating 60 Years of Grace
          </p>
          <p className="hero-details hero-rise" style={{ '--rise-order': 2 } as React.CSSProperties}>
            Tuesday, December 8th, 2026 at 6:00 PM<br />
            1625 Olive St NE, Washington, DC 20019
          </p>
          <button
            className="hero-rise"
            style={{ '--rise-order': 3 } as React.CSSProperties}
            onClick={onRsvpClick}
          >
            Reserve Your Seat
          </button>
        </div>
      </div>
    </section>
  )
}
