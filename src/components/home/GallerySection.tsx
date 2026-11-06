import galleryImageOne from '../../assets/gallery-1.jpg'
import galleryImageTwo from '../../assets/gallery-2.jpg'
import galleryImageThree from '../../assets/gallery-3.jpg'
import galleryImageFour from '../../assets/gallery-4.jpg'
import galleryImageFive from '../../assets/gallery-5.jpg'
import galleryImageSix from '../../assets/gallery-6.jpg'

const galleryImages = [
  { src: galleryImageOne, alt: 'Pastor Mrs Adebisi in a teal pleated gown' },
  { src: galleryImageTwo, alt: 'Pastor Mrs Adebisi in a pink striped blouse, seated at a table' },
  { src: galleryImageThree, alt: 'Pastor Mrs Adebisi in a teal gown, smiling with a hand on her hip' },
  { src: galleryImageFour, alt: 'Pastor Mrs Adebisi in a royal blue gown, seated on a tufted chair' },
  { src: galleryImageFive, alt: 'Pastor Mrs Adebisi in a teal pleated gown, full length' },
  { src: galleryImageSix, alt: 'Close portrait of Pastor Mrs Adebisi in a pink striped blouse' },
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
