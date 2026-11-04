import galleryImageOne from '../../assets/placeholder.svg'
import galleryImageTwo from '../../assets/placeholder.svg'
import galleryImageThree from '../../assets/placeholder.svg'
import galleryImageFour from '../../assets/placeholder.svg'
import galleryImageFive from '../../assets/placeholder.svg'

const galleryImages = [
  { src: galleryImageOne, alt: 'Paul and Abosede celebration photo 1' },
  { src: galleryImageTwo, alt: 'Paul and Abosede celebration photo 2' },
  { src: galleryImageThree, alt: 'Paul and Abosede celebration photo 3' },
  { src: galleryImageFour, alt: 'Paul and Abosede celebration photo 4' },
  { src: galleryImageFive, alt: 'Paul and Abosede celebration photo 5' },
]

export default function Gallery() {
  return (
    <section className="gallery">
      <h2>Gallery</h2>
      <div className="gallery-grid">
        {galleryImages.map((image) => (
          <img key={image.src} src={image.src} alt={image.alt} />
        ))}
      </div>
    </section>
  )
}
