export default function ResenasPage() {
  return (
    <>
      <div className="topbar">
        <div>
          <h1>Reseñas</h1>
          <div className="sub">
            Calificá a los creadores con los que trabajaste y mirá lo que dicen
            de vos
          </div>
        </div>
      </div>
      <div className="content">
        <div className="tabs-row">
          <button type="button" className="tab-pill is-active">
            Para dejar (0)
          </button>
          <button type="button" className="tab-pill" disabled>
            Recibidas (0)
          </button>
        </div>
        <div className="empty-state">
          <h3>Todavía no hay reseñas</h3>
          <p>
            Cuando confirmes creadores en tus eventos, vas a poder dejarles una
            reseña desde acá. Las reseñas que te dejen también van a aparecer
            en esta sección.
          </p>
        </div>
      </div>
    </>
  );
}
