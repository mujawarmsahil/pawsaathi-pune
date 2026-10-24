import { ArrowRight, Check, Heart, PawPrint, ShieldCheck, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const photos = {
  hero: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1100&q=85',
  walk: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=700&q=80',
  play: 'https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&w=700&q=80',
  care: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=700&q=80',
  park: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=80',
};

export function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <i /> Pune’s local pet-care community
            </p>
            <h1>
              A little help.
              <br />A lot more <span>tail wags.</span>
            </h1>
            <p className="hero-lead">
              Find a caring, verified companion for your pet’s walks, playtime, and everyday needs.
            </p>
            <div className="hero-actions">
              <Link className="button" to="/caretakers">
                Find a caretaker <ArrowRight size={18} />
              </Link>
              <Link className="text-link" to="/services">
                Explore services <ArrowRight size={16} />
              </Link>
            </div>
            <div className="hero-assurance">
              <ShieldCheck size={17} />
              <span>Thoughtful care, close to home in Pune</span>
            </div>
          </div>
          <div className="hero-image-wrap">
            <img src={photos.hero} alt="Golden retriever enjoying a sunny day outdoors" />
            <div className="photo-caption">
              <span className="caption-icon">
                <Heart size={18} />
              </span>
              <span>
                <b>Care that feels like family</b>
                <small>Made for Pune pet parents</small>
              </span>
            </div>
            <div className="photo-stamp">
              <PawPrint size={19} />
              <span>
                Trusted
                <br />
                companions
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="section" id="services">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Good days, covered</p>
              <h2>
                Care for every kind
                <br />
                <span>of pet day.</span>
              </h2>
            </div>
            <p>
              From the morning walk to company while you’re out, find care that fits your routine.
            </p>
          </div>
          <div className="service-grid">
            {[
              [
                'Pet walking',
                photos.walk,
                'Fresh air, familiar routes, and a happy pup on the way home.',
              ],
              [
                'Play & companionship',
                photos.play,
                'A friendly face, playful moments, and company that cares.',
              ],
              [
                'Short-duration care',
                photos.care,
                'A few hours of attentive care, right when you need it.',
              ],
            ].map(([title, photo, description]) => (
              <Link className="service-card" to="/caretakers" key={title}>
                <img src={photo} alt="" />
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <span>
                    Explore care <ArrowRight size={15} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="warm-section" id="how-it-works">
        <div className="container">
          <div className="center-heading">
            <p className="eyebrow">A few easy steps</p>
            <h2>
              Simple for you.
              <br />
              <span>Lovely for them.</span>
            </h2>
          </div>
          <div className="steps">
            {[
              [
                '01',
                'Share the details',
                'Tell us about your pet, the service, and when you need a hand.',
              ],
              [
                '02',
                'Choose your saathi',
                'Browse local caretaker profiles and request a time that works.',
              ],
              [
                '03',
                'Feel at ease',
                'Follow the booking status and enjoy a little more peace of mind.',
              ],
            ].map(([number, title, description]) => (
              <div key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="trust-section" id="trust">
        <div className="container trust-grid">
          <div>
            <p className="eyebrow">A promise built around care</p>
            <h2>
              Because trust is
              <br />
              part of the service.
            </h2>
            <p className="body-copy">
              PawSaathi brings local pet parents and caretakers together with clear profiles,
              transparent hourly rates, and a booking record you can follow.
            </p>
            <div className="trust-list">
              <p>
                <Check /> Caretakers reviewed before appearing in search
              </p>
              <p>
                <Check /> Clear hourly rates in Indian rupees
              </p>
              <p>
                <Check /> Booking requests with visible status
              </p>
            </div>
          </div>
          <div className="pune-card">
            <img src={photos.park} alt="A leafy walking path in a city park" />
            <div className="pune-card-info">
              <p className="eyebrow">Rooted in your neighbourhood</p>
              <h3>Pune, one walk at a time.</h3>
              <p>
                Connecting pet families across Baner, Aundh, Kothrud, Viman Nagar, Kharadi, Koregaon
                Park, Wakad, and Hadapsar.
              </p>
              <Link to="/caretakers">
                Explore local care <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="cta-section">
        <div className="container cta-card">
          <div>
            <p className="eyebrow">Your pet deserves a saathi</p>
            <h2>
              Make room for more
              <br />
              <span>happy little moments.</span>
            </h2>
          </div>
          <Link className="button button-light" to="/register">
            Join PawSaathi <ArrowRight size={17} />
          </Link>
        </div>
      </section>
      <div className="sr-only">
        <Star aria-hidden="true" />
      </div>
    </main>
  );
}
