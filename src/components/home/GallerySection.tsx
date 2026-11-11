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

export default function Gallery() {
  return (
    <section className="gallery">
      <h2>Gallery</h2>
      <div className="gallery-marquee">
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
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
