import aboutImage from '../../assets/placeholder.svg'

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
              <dd>Saturday, Sept 19 &middot; 3:00 PM</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>Richland Golf Club</dd>
            </div>
            <div>
              <dt>Dress Code</dt>
              <dd>Traditional</dd>
            </div>
            <div>
              <dt>Color of the Day</dt>
              <dd>Wine and gold</dd>
            </div>
          </dl>
        </div>
        <img src={aboutImage} alt="Paul and Abosede" />
      </div>
    </section>
  )
}
