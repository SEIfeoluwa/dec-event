import About from '../components/home/AboutSection'
import Gallery from '../components/home/GallerySection'
import Hero from '../components/home/HeroSection'
import Rsvp from '../components/home/RsvpSection'
import Schedule from '../components/home/ScheduleSection'

export default function HomePage() {

  const scrollToRsvpForm = () => {
    const element = document.getElementById('rsvp-form-section')
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main>
      <Hero onRsvpClick={scrollToRsvpForm} />
      <About />
      <Gallery />
      <Schedule />
      <Rsvp onRsvpClick={scrollToRsvpForm} />
    </main>
  )
}
