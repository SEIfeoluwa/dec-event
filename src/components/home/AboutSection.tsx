import aboutImage from '../../assets/about.jpg'

export default function About() {
  return (
    <section className="about">
      <div className="about-content">
        <div className="about-text">
          <h3>Faithful &amp; Favored</h3>
          <p>
            Six decades of unwavering faith, dedicated leadership, and profound impact! Join us as we gather to celebrate
            the 60th birthday of our beloved Pastor Oluwakemi Adebisi.
          </p>
          <p>
            Reflecting the words of Luke 1:28 &mdash; &ldquo;Greetings, you who are highly favored! The Lord is with
            you&rdquo; &mdash; Pastor Oluwakemi has exemplified through every season what it means to walk in divine
            purpose, anchored by God&rsquo;s faithfulness and crowned with His grace. Let us come together to honor her
            legacy, offer our thanksgiving, and celebrate this monumental milestone of being Faithful &amp; Favored.
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
              <dd>Grace &amp; Royalty</dd>
            </div>
            <div>
              <dt>Color of the Day</dt>
              <dd>Touch of Blue</dd>
            </div>
          </dl>
        </div>
        <img src={aboutImage} alt="Portrait of Pastor Mrs Adebisi in a pink striped blouse" />
      </div>
    </section>
  )
}
