import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <Link className="brand" to="/">
            PawSaathi <em>Pune</em>
          </Link>
          <p>Trusted Care. Happy Pets.</p>
          <small>Local care for the pets we call family.</small>
        </div>
        <div>
          <strong>Discover</strong>
          <Link to="/services">Services & pricing</Link>
          <Link to="/caretakers">Find a caretaker</Link>
        </div>
        <div>
          <strong>Your account</strong>
          <Link to="/login">Log in</Link>
          <Link to="/register">Join PawSaathi</Link>
        </div>
        <div>
          <strong>Based in Pune</strong>
          <span>Maharashtra, India</span>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 PawSaathi Pune</span>
        <span>Care starts with trust.</span>
      </div>
    </footer>
  );
}
