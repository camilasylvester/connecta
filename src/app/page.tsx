import Link from "next/link";
import { LandingProfilePreview } from "@/components/LandingProfilePreview";
import { LogoWordmark } from "@/components/LogoWordmark";
import "./landing.css";

function CornerMarks() {
  return (
    <>
      <span className="corner corner-left" aria-hidden="true">+</span>
      <span className="corner corner-right" aria-hidden="true">+</span>
    </>
  );
}

function BrandLogo({ hero = false }: { hero?: boolean }) {
  return (
    <LogoWordmark
      className={hero ? "landing-hero-logo" : "landing-logo"}
    />
  );
}

export default function HomePage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-nav">
          <Link href="#top" aria-label="Connecta, inicio"><BrandLogo /></Link>
          <nav className="landing-nav-links" aria-label="Navegación principal">
            <a href="#que-es">Qué es</a>
            <a href="#creadores">Para creadores</a>
            <a href="#marcas">Para marcas</a>
            <a href="#como-funciona">Cómo funciona</a>
          </nav>
          <div className="landing-nav-actions">
            <Link href="/login" className="landing-btn landing-btn-outline landing-btn-small">Iniciar sesión</Link>
            <Link href="/registro" className="landing-btn landing-btn-solid landing-btn-small">Crear cuenta</Link>
            <details className="landing-mobile-menu">
              <summary aria-label="Abrir menú">Menú</summary>
              <nav>
                <a href="#que-es">Qué es</a>
                <a href="#creadores">Para creadores</a>
                <a href="#marcas">Para marcas</a>
                <a href="#como-funciona">Cómo funciona</a>
                <Link href="/login">Iniciar sesión</Link>
              </nav>
            </details>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-cover landing-frame" id="top">
          <CornerMarks />
          <div className="cover-top">
            <span className="frame-label">Formalizando la relación<br />entre marcas y creadores.</span>
            <p>Conectamos marcas y creadores en un mismo lugar.</p>
          </div>
          <div className="cover-main">
            <BrandLogo hero />
            <div className="cover-actions">
              <Link href="/registro?role=creator" className="landing-btn landing-btn-solid landing-btn-large">Soy creador</Link>
              <Link href="/registro?role=brand" className="landing-btn landing-btn-outline landing-btn-large">Soy marca</Link>
            </div>
            <span className="cover-note">Gratis para empezar</span>
          </div>
        </section>

        <section className="landing-section landing-frame" id="que-es">
          <CornerMarks />
          <div className="landing-wrap section-inner">
            <span className="frame-label">02 — Qué es Connecta</span>
            <div className="section-heading">
              <h1>El puente,<br />no el <span>intermediario.</span></h1>
              <p>Reglas claras. Para las dos partes.</p>
            </div>
            <ul className="feature-grid">
              <li>Perfiles verificados</li>
              <li>Reseñas reales entre marcas y creadores</li>
              <li>Historial que se construye con cada colaboración</li>
              <li>Cero comisión, cero intermediarios</li>
            </ul>
          </div>
        </section>

        <section className="audience-grid" aria-label="Para creadores y marcas">
          <article className="audience-panel" id="creadores">
            <span className="frame-label">Para creadores</span>
            <h2>Visibilidad, oportunidades reales y reputación.</h2>
            <ul>
              <li>Perfil con tus redes conectadas</li>
              <li>Acceso directo a marcas afines</li>
              <li>Historial y reseñas que abren puertas</li>
              <li>Crecimiento sostenido, no un post aislado</li>
            </ul>
            <Link href="/registro?role=creator" className="landing-btn landing-btn-solid">Crear mi perfil</Link>
          </article>
          <article className="audience-panel" id="marcas">
            <span className="frame-label">Para marcas</span>
            <h2>Creadores por estilo, zona y reseñas verificadas.</h2>
            <ul>
              <li>Transparencia total por perfil</li>
              <li>Postulaciones ordenadas por afinidad</li>
              <li>Historial de colaboraciones anteriores</li>
              <li>Panel claro: aceptar, rechazar, seguimiento</li>
            </ul>
            <Link href="/registro?role=brand" className="landing-btn landing-btn-outline">Publicar un evento</Link>
          </article>
        </section>

        <section className="landing-section landing-frame" id="como-funciona">
          <CornerMarks />
          <div className="landing-wrap section-inner">
            <span className="frame-label">03 — El proceso</span>
            <div className="section-heading">
              <h2>Cómo funciona</h2>
              <p>El creador que necesitás. El evento que buscás.</p>
            </div>
            <div className="process-grid">
              <article><span>01</span><h3>Evento</h3><p>La marca describe qué busca y publica.</p></article>
              <article><span>02</span><h3>Postulación</h3><p>Aparece en el feed. Postulación con un clic.</p></article>
              <article><span>03</span><h3>Selección</h3><p>La marca elige. Coordinación directa.</p></article>
            </div>
            <div className="example-row">
              <p><strong>Ejemplo real — Inauguración Costa 7070.</strong> Evento publicado, postulaciones por afinidad en minutos.</p>
              <div>
                <span><strong>200</strong>Postulantes</span>
                <span><strong>50</strong>Confirmados</span>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section landing-frame">
          <CornerMarks />
          <div className="landing-wrap section-inner">
            <span className="frame-label">04 — El CV de creador</span>
            <div className="section-heading cv-heading">
              <h2>Más que un perfil:<br />tu <span>historial verificado.</span></h2>
            </div>
            <div className="cv-layout">
              <div className="cv-copy">
                <p>Un perfil propio, separado del feed personal. No un “mirá mi Instagram” — datos verificables.</p>
                <ul>
                  <li>Redes conectadas</li>
                  <li>Colaboraciones realizadas</li>
                  <li>Reseñas de marcas</li>
                  <li>Categoría y zona</li>
                </ul>
              </div>
              <LandingProfilePreview />
            </div>
          </div>
        </section>

        <section className="landing-section landing-frame reputation-section">
          <CornerMarks />
          <div className="landing-wrap section-inner">
            <span className="frame-label">05 — La reputación se construye</span>
            <h2>Cada colaboración <span>suma.</span></h2>
            <p>Reseña mutua. Historial permanente. Cuanto más colaborás, mejor el match.</p>
          </div>
        </section>

        <section className="landing-rule landing-frame">
          <CornerMarks />
          <div className="landing-wrap section-inner">
            <span className="frame-label">06 — La regla</span>
            <p>Vos elegís con quién trabajar.</p>
            <h2>Sin comisión.<br />Sin intermediarios.</h2>
          </div>
        </section>

        <section className="landing-section landing-frame" id="sumate">
          <CornerMarks />
          <div className="landing-wrap section-inner">
            <span className="frame-label">07 — Sumate</span>
            <div className="final-grid">
              <h2>Tu próxima colaboración<br />empieza <span>acá.</span></h2>
              <div>
                <p>Marca o creador — tu lugar te espera.</p>
                <div className="final-actions">
                  <Link href="/registro?role=creator" className="landing-btn landing-btn-solid landing-btn-large">Soy creador</Link>
                  <Link href="/registro?role=brand" className="landing-btn landing-btn-outline landing-btn-large">Soy marca</Link>
                </div>
                <span className="final-url">connectainf.com</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-wrap">
          <Link href="#top" aria-label="Volver al inicio"><BrandLogo /></Link>
          <div>
            <a href="#">Instagram</a>
            <a href="#">TikTok</a>
            <a href="mailto:hola@connectainf.com">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
