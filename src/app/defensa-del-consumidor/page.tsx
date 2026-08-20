import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Defensa del consumidor — CONNECTA",
  description:
    "Información al consumidor según la Ley 24.240 y canales de reclamo.",
};

export default function DefensaConsumidorPage() {
  return (
    <LegalShell eyebrow="Legal" title="Ley de defensa del consumidor">
      <section>
        <h2>1. Información al usuario</h2>
        <p>
          CONNECTA es una plataforma gratuita para empezar, que conecta marcas y
          creadores. Antes de registrarte o usar el servicio, podés consultar
          estos datos y nuestras{" "}
          <a href="/terminos">condiciones de uso</a>.
        </p>
      </section>
      <section>
        <h2>2. Derechos del consumidor (Ley 24.240)</h2>
        <p>
          Si actuás como consumidor o usuaria/o final de nuestros servicios en
          Argentina, tenés derecho a:
        </p>
        <ul>
          <li>Información clara y veraz sobre el servicio.</li>
          <li>Trato digno y equitativo.</li>
          <li>Protección de tus intereses económicos.</li>
          <li>
            Acceso a vías de reclamo administrativas y judiciales cuando
            corresponda.
          </li>
        </ul>
      </section>
      <section>
        <h2>3. Cómo reclamar ante CONNECTA</h2>
        <p>
          Primero escribinos a{" "}
          <a href="mailto:hola@connectainf.com">hola@connectainf.com</a>{" "}
          describiendo el problema. Respondemos a la brevedad posible.
        </p>
      </section>
      <section>
        <h2>4. Autoridad de aplicación</h2>
        <p>
          También podés dirigirte a la Dirección Nacional de Defensa del
          Consumidor y Arbitraje del Consumo, o a la oficina de defensa del
          consumidor de tu jurisdicción.
        </p>
        <ul>
          <li>
            Sitio oficial:{" "}
            <a
              href="https://www.argentina.gob.ar/produccion/defensadelconsumidor"
              target="_blank"
              rel="noopener noreferrer"
            >
              argentina.gob.ar — Defensa del consumidor
            </a>
          </li>
          <li>
            Botón de arrepentimiento / denuncias online (cuando aplique):{" "}
            <a
              href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario"
              target="_blank"
              rel="noopener noreferrer"
            >
              formularios oficiales
            </a>
          </li>
        </ul>
      </section>
      <section>
        <h2>5. Datos del servicio</h2>
        <ul>
          <li>Nombre comercial: CONNECTA</li>
          <li>Sitio: https://www.connectainf.com</li>
          <li>
            Email:{" "}
            <a href="mailto:hola@connectainf.com">hola@connectainf.com</a>
          </li>
        </ul>
      </section>
    </LegalShell>
  );
}
