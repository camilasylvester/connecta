import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Seguridad — CONNECTA",
  description: "Cómo cuidamos la seguridad de CONNECTA.",
};

export default function SeguridadPage() {
  return (
    <LegalShell eyebrow="Seguridad" title="Seguridad de la página web">
      <section>
        <h2>1. Conexión cifrada</h2>
        <p>
          El sitio en producción usa HTTPS. El tráfico entre tu navegador y
          nuestros servidores viaja cifrado.
        </p>
      </section>
      <section>
        <h2>2. Acceso a cuentas</h2>
        <ul>
          <li>
            El login y el registro se gestionan con Clerk (email/contraseña y
            Google cuando está habilitado).
          </li>
          <li>
            No almacenamos contraseñas en texto plano en nuestra base de datos.
          </li>
          <li>
            Las cuentas de marca y creador pasan por revisión antes de operar
            con todas las funciones.
          </li>
        </ul>
      </section>
      <section>
        <h2>3. Datos y proveedores</h2>
        <p>
          Usamos infraestructura de confianza (hosting, base de datos y
          autenticación) con acceso restringido. Solo el equipo autorizado de
          CONNECTA puede revisar solicitudes y moderar contenido.
        </p>
      </section>
      <section>
        <h2>4. Buenas prácticas para vos</h2>
        <ul>
          <li>Entrá siempre desde https://www.connectainf.com</li>
          <li>No compartas tu contraseña ni códigos de verificación.</li>
          <li>
            Cerrá sesión en dispositivos compartidos.
          </li>
          <li>
            Si ves algo sospechoso, escribinos a{" "}
            <a href="mailto:hola@connectainf.com">hola@connectainf.com</a>.
          </li>
        </ul>
      </section>
      <section>
        <h2>5. Incidentes</h2>
        <p>
          Si detectamos un incidente de seguridad que afecte tus datos, vamos a
          tomar medidas y avisarte por los canales disponibles cuando
          corresponda.
        </p>
        <div className="legal-cta">
          <Link href="/privacidad" className="landing-btn landing-btn-outline">
            Ver política de privacidad
          </Link>
          <Link href="/contacto" className="landing-btn landing-btn-solid">
            Contacto
          </Link>
        </div>
      </section>
    </LegalShell>
  );
}
