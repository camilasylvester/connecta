import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Contacto — CONNECTA",
  description: "Escribinos a CONNECTA.",
};

export default function ContactoPage() {
  return (
    <LegalShell eyebrow="Contacto" title="Contacto nuestro">
      <section>
        <h2>Escribinos</h2>
        <p>
          Para soporte, altas de marca, problemas de acceso o consultas
          generales:
        </p>
        <p>
          <a href="mailto:hola@connectainf.com">hola@connectainf.com</a>
        </p>
        <div className="legal-cta">
          <a
            href="mailto:hola@connectainf.com"
            className="landing-btn landing-btn-solid"
          >
            Enviar email
          </a>
          <Link href="/login" className="landing-btn landing-btn-outline">
            Ir al login
          </Link>
        </div>
      </section>
      <section>
        <h2>Horario de respuesta</h2>
        <p>
          Respondemos de lunes a viernes en días hábiles. Si tu consulta es
          urgente (bloqueo de cuenta o acceso), incluí el email con el que te
          registraste.
        </p>
      </section>
      <section>
        <h2>También podés consultar</h2>
        <ul>
          <li>
            <Link href="/terminos">Términos y condiciones</Link>
          </li>
          <li>
            <Link href="/privacidad">Política de privacidad</Link>
          </li>
          <li>
            <Link href="/defensa-del-consumidor">Defensa del consumidor</Link>
          </li>
          <li>
            <Link href="/seguridad">Seguridad del sitio</Link>
          </li>
        </ul>
      </section>
    </LegalShell>
  );
}
