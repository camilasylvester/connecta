import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Política de privacidad — CONNECTA",
  description: "Cómo CONNECTA trata tus datos personales.",
};

export default function PrivacidadPage() {
  return (
    <LegalShell eyebrow="Legal" title="Política de privacidad">
      <section>
        <h2>1. Responsable</h2>
        <p>
          CONNECTA trata datos personales necesarios para operar la plataforma.
          Contacto:{" "}
          <a href="mailto:hola@connectainf.com">hola@connectainf.com</a>.
        </p>
      </section>
      <section>
        <h2>2. Qué datos recopilamos</h2>
        <ul>
          <li>
            Datos de cuenta: email, nombre, rol (creador o marca) e información
            de autenticación gestionada por Clerk.
          </li>
          <li>
            Perfil de creador: Instagram y otras redes, ubicación, categoría,
            seguidores declarados y datos del formulario de registro.
          </li>
          <li>
            Perfil de marca: nombre comercial, contacto y datos del formulario.
          </li>
          <li>
            Uso de la plataforma: eventos, postulaciones, mensajes y actividad
            asociada a tu cuenta.
          </li>
        </ul>
      </section>
      <section>
        <h2>3. Para qué los usamos</h2>
        <ul>
          <li>Crear y administrar tu cuenta.</li>
          <li>Mostrar perfiles a marcas o eventos a creadores, según el rol.</li>
          <li>Revisar solicitudes de acceso y prevenir abusos.</li>
          <li>Mejorar el producto y responder consultas de soporte.</li>
        </ul>
      </section>
      <section>
        <h2>4. Con quién compartimos datos</h2>
        <p>
          No vendemos tus datos. Compartimos información solo cuando es
          necesario para prestar el servicio: por ejemplo, una marca ve la ficha
          de un creador que se postuló a su evento. También usamos proveedores
          técnicos (autenticación, hosting, base de datos) bajo contrato y con
          medidas de seguridad razonables.
        </p>
      </section>
      <section>
        <h2>5. Conservación</h2>
        <p>
          Conservamos los datos mientras la cuenta esté activa y el tiempo
          adicional que exija la ley o la resolución de reclamos. Podés pedir la
          baja escribiéndonos.
        </p>
      </section>
      <section>
        <h2>6. Tus derechos</h2>
        <p>
          En Argentina, la Ley 25.326 de Protección de los Datos Personales te
          reconoce derechos de acceso, rectificación y cancelación. Para
          ejercerlos, escribinos a{" "}
          <a href="mailto:hola@connectainf.com">hola@connectainf.com</a>.
        </p>
      </section>
      <section>
        <h2>7. Cookies y sesiones</h2>
        <p>
          Usamos cookies y almacenamiento necesarios para mantener la sesión y
          el funcionamiento del login. No usamos publicidad de terceros
          basada en tu perfil dentro de CONNECTA.
        </p>
      </section>
    </LegalShell>
  );
}
