import heroImg from '../../assets/placeholder.svg'

interface HeroProps {
  onRsvpClick: () => void
}

export default function Hero({ onRsvpClick }: HeroProps) {
  return (
    <section className="hero" style={{ backgroundImage: `url(${heroImg})` }}>
      <div className="hero-content">
        <p className="hero-eyebrow">Please join us in celebrating</p>
        <h1>Mr &amp; Mrs Fayemi</h1>
        <p className="hero-ages">Celebration of 75 &amp; 70 years of life</p>
        <p className="hero-details">
          Saturday, September 19th, 2026 at 3:00 PM<br />
          Richland Golf Club, 50 Glenbrook Dr, Middletown, MD 21769
        </p>
        <button onClick={onRsvpClick}>
          Reserve Your Seat
        </button>
      </div>
    </section>
  )
}
