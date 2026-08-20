import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Términos y condiciones — CONNECTA",
  description: "Condiciones de uso de la plataforma CONNECTA.",
};

export default function TerminosPage() {
  return (
    <LegalShell eyebrow="Legal" title="Términos y condiciones">
      <section>
        <h2>1. Quiénes somos</h2>
        <p>
          CONNECTA es una plataforma digital que conecta marcas y creadores de
          contenido para colaboraciones y eventos. El sitio opera en{" "}
          <a href="https://www.connectainf.com">www.connectainf.com</a>.
        </p>
      </section>
      <section>
        <h2>2. Aceptación</h2>
        <p>
          Al crear una cuenta, solicitar acceso o usar CONNECTA, aceptás estos
          términos. Si no estás de acuerdo, no uses la plataforma.
        </p>
      </section>
      <section>
        <h2>3. Cuentas y roles</h2>
        <ul>
          <li>
            <strong>Creadores:</strong> pueden completar su ficha, postularse a
            eventos y gestionar su perfil.
          </li>
          <li>
            <strong>Marcas:</strong> solicitan cuenta; cuando CONNECTA las
            acepta, pueden publicar eventos y revisar postulaciones.
          </li>
          <li>
            CONNECTA puede aprobar, rechazar o suspender cuentas si hay
            incumplimiento, abuso o datos falsos.
          </li>
        </ul>
      </section>
      <section>
        <h2>4. Uso permitido</h2>
        <p>
          Te comprometés a usar la plataforma de forma lícita, respetuosa y
          veraz. No está permitido suplantar identidades, publicar contenido
          ilegal, acosar a otros usuarios ni intentar vulnerar la seguridad del
          sistema.
        </p>
      </section>
      <section>
        <h2>5. Contenido y responsabilidad</h2>
        <p>
          Cada usuario es responsable de la información que carga (perfil,
          eventos, postulaciones, mensajes). CONNECTA no interviene como
          intermediario comercial obligatorio en las colaboraciones: facilita el
          encuentro; los acuerdos entre marca y creador son entre las partes.
        </p>
      </section>
      <section>
        <h2>6. Disponibilidad</h2>
        <p>
          Trabajamos para que el servicio esté disponible, pero no garantizamos
          un funcionamiento ininterrumpido. Podemos modificar, pausar o
          discontinuar funciones con el aviso que resulte razonable.
        </p>
      </section>
      <section>
        <h2>7. Cambios</h2>
        <p>
          Podemos actualizar estos términos. La versión vigente se publica en
          esta página con la fecha de actualización.
        </p>
      </section>
      <section>
        <h2>8. Contacto</h2>
        <p>
          Consultas sobre estos términos:{" "}
          <a href="mailto:hola@connectainf.com">hola@connectainf.com</a>.
        </p>
      </section>
    </LegalShell>
  );
}
