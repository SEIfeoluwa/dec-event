import aboutImage from '../../assets/about.jpg'

export default function About() {
  return (
    <section className="about">
      <div className="about-content">
        <div className="about-text">
          <h3>A Lifetime Worth Celebrating</h3>
          <p>
            Together they have shared decades of love, laughter, and unforgettable stories. This year, we gather to honor
            two extraordinary milestones with an evening of fine dining, live music, and cherished company. Come raise a
            glass to the years behind &mdash; and the many still to come.
          </p>

          <dl className="event-details">
            <div>
              <dt>Date &amp; Time</dt>
              <dd>Tuesday, Dec 8 &middot; 6:00 PM</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>1625 Olive St NE, Washington, DC 20019</dd>
            </div>
            <div>
              <dt>Dress Code</dt>
              <dd>Traditional</dd>
            </div>
            <div>
              <dt>Color of the Day</dt>
              <dd>TBD</dd>
            </div>
          </dl>
        </div>
        <img src={aboutImage} alt="Portrait of Pastor Mrs Adebisi in a pink striped blouse" />
      </div>
    </section>
  )
}
