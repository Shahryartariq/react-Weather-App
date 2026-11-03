/** Shown while a new place loads: the layout of the page with nothing filled in. */
export default function Loading() {
  return (
    <div className="page" data-sky="clouds" aria-busy="true">
      <div className="sky">
        <div className="topbar topbar-skeleton" />
        <section className="hero" aria-label="Loading weather">
          <div className="hero-place">
            <span className="skeleton skeleton-title" />
            <span className="skeleton skeleton-line" />
          </div>
          <div className="hero-reading">
            <span className="skeleton skeleton-temp" />
          </div>
        </section>
        <p className="visually-hidden" role="status">
          Loading the forecast…
        </p>
      </div>
    </div>
  );
}
