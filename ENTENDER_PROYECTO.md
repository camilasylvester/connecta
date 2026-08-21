# Entender CONNECTA (guía para el dueño)

**Para quién es:** vos, dueño del producto, sin necesidad de ser programador senior.  
**Qué no es:** un manual para programar. Es un mapa para entender qué hace la plataforma, dónde vive cada cosa y qué riesgos conviene conocer.  
**Fecha:** agosto 2026 · Sitio en producción: https://www.connectainf.com

> Tip: en Cursor abrí este archivo y usá **Cmd + Shift + V** para verlo con formato bonito.

---

## 1. Resumen en un párrafo

CONNECTA es una plataforma web que conecta **marcas** (empresas que organizan eventos o campañas) con **creadores de contenido** (influencers). La marca publica eventos; el creador se postula; la marca (o un admin) acepta o rechaza. Antes de usar la app a fondo, cada persona se registra con email y contraseña, completa un formulario de perfil y espera que un administrador apruebe la cuenta. Instagram y TikTok hoy se usan como **identidad pública** (usuario @ y links), no como “login con Instagram/TikTok”.

---

## 2. Stack tecnológico

“Stack” = el conjunto de herramientas con las que está construida la app.

### Frontend (lo que ve el usuario en el navegador)

| Tecnología | Para qué sirve, en simple |
|------------|---------------------------|
| **Next.js** | El “esqueleto” de la web: arma las páginas, las URLs y cómo se muestra cada pantalla. |
| **React** | Librería para construir pantallas con piezas reutilizables (botones, formularios, listas). |
| **TypeScript** | JavaScript con reglas más estrictas: ayuda a detectar errores antes de publicar. |
| **Tailwind CSS** | Forma de estilar (colores, tipografía, espaciados) sin escribir tanto CSS a mano. |

### Backend / lógica del servidor

| Tecnología | Para qué sirve, en simple |
|------------|---------------------------|
| **Next.js (lado servidor)** | Además de las pantallas, ejecuta lógica segura en el servidor (guardar perfiles, crear eventos, aprobar cuentas). |
| **Server Actions** | Funciones del servidor que la pantalla llama al enviar un formulario (sin montar una API aparte para cada cosa). |
| **Middleware** | Un “portero” que revisa cada pedido: si la ruta es privada y no hay sesión, manda a login. |

### Autenticación (quién sos)

| Tecnología | Para qué sirve, en simple |
|------------|---------------------------|
| **Clerk** | Servicio externo que crea cuentas, guarda **contraseñas** (hasheadas), maneja login, códigos de email y a veces Google. CONNECTA no guarda la contraseña en su propia base. |

### Base de datos y archivos

| Tecnología | Para qué sirve, en simple |
|------------|---------------------------|
| **Neon** | Base de datos PostgreSQL en la nube: perfiles, eventos, postulaciones, posts del portfolio. |
| **Drizzle ORM** | Capa que traduce “quiero guardar un evento” a consultas SQL de forma ordenada y tipada. |
| **Vercel Blob** | Almacén de archivos para fotos nuevas (avatar, imágenes de eventos). En la base solo queda el **link** a la foto. |

### Hosting y operación

| Tecnología | Para qué sirve, en simple |
|------------|---------------------------|
| **Vercel** | Donde vive el sitio en internet: deploy, dominio, variables secretas, Blob. |
| **Variables de entorno** (`.env` / Vercel) | Configuración secreta: claves de Clerk, URL de Neon, emails de admin, token de Blob. No van en el código público. |

### Cosas que existen pero no son el camino principal

| Cosa | Nota |
|------|------|
| Carpeta `supabase/` | Restos de un enfoque viejo. **Hoy la base viva es Neon.** |
| Carpeta `mockups/` | Diseños HTML de referencia; no son la app en producción. |

---

## 3. Arquitectura del proyecto

Pensá el repo como una casa: cada carpeta es una habitación.

```
connecta/
├── src/                 → El código de la aplicación
│   ├── app/             → Páginas = URLs de la web
│   ├── components/      → Piezas de interfaz reutilizables
│   ├── db/              → Definición de tablas + conexión a Neon
│   ├── lib/             → Lógica compartida (auth, Instagram, roles…)
│   └── middleware.ts    → Portero de rutas
├── drizzle/             → Scripts SQL de cómo se creó/evolucionó la base
├── public/              → Logos e imágenes estáticas del sitio
├── mockups/             → Diseños viejos de referencia
├── docs/                → Documentos (auditoría, etc.)
├── scripts/             → Herramientas manuales (chequear env, migrar Clerk)
├── package.json         → Lista de dependencias y comandos npm
└── DEPLOY.md / README   → Cómo desplegar / arrancar
```

### `src/app/` — las pantallas (por URL)

| Ruta / carpeta | Qué es |
|----------------|--------|
| `page.tsx` (`/`) | Landing (página de marketing). |
| `login/` | Iniciar sesión. |
| `registro/` | Crear cuenta (elige rol → email/contraseña con Clerk). |
| `after-auth/` | Puente justo después de login/registro: prepara el perfil y redirige. |
| `completar-perfil/` | Formulario largo de onboarding. |
| `pendiente/` / `rechazado/` | Estados mientras / si no te aprueban. |
| `eventos/` | Feed de eventos para creadores. |
| `aplicar/[token]/ | Postularse a un evento con link de invitación. |
| `mis-postulaciones/` | Historial de postulaciones del creador. |
| `mi-perfil/` | Perfil social del creador (foto, IG, posts). |
| `dashboard/` | Panel de **marca** (eventos, creadores, config). |
| `admin/` | Panel de **administrador**. |
| `crear-contrasena/` | Para cuentas que aún no tienen password en Clerk. |
| `sso-callback/` | Vuelta de login con Google (si está habilitado en Clerk). |
| `actions.ts` | Muchas acciones de servidor: crear evento, postularse, admin, etc. |

### `src/components/` — piezas de UI

Ejemplos importantes:

- `RegistroClerkSignUp` — alta de cuenta con Clerk  
- `EmailPasswordSignIn` — login  
- `OnboardingForm` / `CompletarPerfilForm` — formulario de perfil  
- `EventosFeedClient` / `SolicitudesClient` — listas con filtros  
- `CreatorSocialProfile` / `CreatorFeed` — perfil y portfolio  
- `EventImagesField` — subir fotos de evento  
- Componentes `Admin*` — botones y shell del admin  

### `src/lib/` — “cerebro” compartido

| Archivo | Responsabilidad |
|---------|-----------------|
| `auth.ts` | Crear/actualizar el perfil en Neon cuando hay sesión Clerk. |
| `account-gate.ts` | Redirigir si falta perfil, está pendiente o rechazado. |
| `roles.ts` | A dónde manda a cada rol (admin / marca / creador). |
| `admin-emails.ts` | Quién es admin (lista en variable `ADMIN_EMAILS`). |
| `clerk-auth.ts` | Mensajes de error de Clerk y rutas post-login. |
| `onboarding.ts` | Campos, validación y estructura del formulario. |
| `instagram.ts` | Normalizar `@usuario` y armar link a Instagram. |
| `posts.ts` | Portfolio: detectar plataforma, miniatura TikTok (oEmbed), links. |
| `blob-upload.ts` | Subir imágenes a Vercel Blob. |
| `image-compress.ts` | Comprimir foto en el navegador antes de subir. |
| `welcome-email.ts` | Stub: lugar para email de bienvenida (aún no envía). |

### `src/db/`

- `schema.ts` — “plano” de las tablas.  
- `index.ts` — cómo conectarse a Neon.

---

## 4. Flujo completo paso a paso

Historia de un **creador** (la de marca es parecida hasta el final).

### Paso 1 — Entra a la web
Abre https://www.connectainf.com.  
**Archivos:** `src/app/page.tsx`, estilos `landing.css`, logos en `public/`.

### Paso 2 — Quiere crear cuenta
Hace clic en “Soy creador” → va a `/registro?role=creator`.  
**Archivos:** `src/app/registro/page.tsx`.

### Paso 3 — Registro (email y contraseña)
1. Si no eligió rol, elige Creador o Marca.  
2. Aparece el registro de **Clerk** (`RegistroClerkSignUp`): email, contraseña (y a veces Google).  
3. Clerk crea el usuario y guarda la contraseña **en Clerk**.  
4. El rol (creator/brand) viaja en metadata de Clerk.  
**Archivos:** `src/components/RegistroClerkSignUp.tsx`, configuración Clerk en `layout.tsx` (`ClerkProvider`).

### Paso 4 — Puente after-auth
Tras registrarse, va a `/after-auth` → `/after-auth/go`.  
Ahí se llama `ensureProfile()`: crea una fila en la tabla `profiles` de Neon (estado **pending**, onboarding incompleto).  
Si el email está en `ADMIN_EMAILS`, lo marca admin y aprobado.  
**Archivos:** `src/app/after-auth/page.tsx`, `src/app/after-auth/go/page.tsx`, `src/lib/auth.ts`.

### Paso 5 — Completa el formulario
Lo mandan a `/completar-perfil`. Llena nombre, Instagram, provincia, temáticas, etc.  
Al enviar, `syncOnboarding` valida y guarda en Neon; marca `onboardingCompleted = true`.  
**Archivos:** `src/app/completar-perfil/page.tsx`, `CompletarPerfilForm.tsx`, `OnboardingForm.tsx`, `src/lib/onboarding.ts`, `src/app/after-auth/actions.ts`.

### Paso 6 — Espera de aprobación
Va a `/pendiente` hasta que un admin apruebe en `/admin/solicitudes`.  
**Archivos:** `src/app/pendiente/page.tsx`, `src/app/admin/solicitudes/page.tsx`, `AdminAccountStatusButtons.tsx`, acción `adminSetAccountStatus` en `actions.ts`.

### Paso 7 — Usa la plataforma (creador aprobado)
Entra a `/eventos`: ve eventos **activos**. Puede filtrar por categoría (chips).  
Puede postularse (desde el feed o con link `/aplicar/...`).  
Ve `/mis-postulaciones` y edita `/mi-perfil` (foto, IG, TikTok, posts).  
**Archivos:** `src/app/eventos/page.tsx`, `EventosFeedClient.tsx`, `ApplyForm.tsx`, `mi-perfil/`, `CreatorSocialProfile.tsx`.

### Paso 8 — “Conecta Instagram” (importante: qué es y qué no es)
Hoy **no** hay “Iniciar sesión con Instagram”.  
El creador escribe su `@` en el formulario / perfil; la app lo normaliza y guarda; muestra un link a su perfil público.  
Los seguidores se cargan **a mano** (número que escribe el usuario).  
**Archivos:** `src/lib/instagram.ts`, campos en `OnboardingForm` / `CreatorSocialProfile`, columnas `handle` y `followers` en Neon.

### Variante marca
Después de aprobación → `/dashboard`: crea eventos (salen en **borrador** hasta que un admin los publique), ve postulaciones, CRM de creadores.  
**Archivos:** `src/app/dashboard/*`, `createEvent` / `updateApplicationStatus` en `actions.ts`.

---

## 5. Módulo por módulo

### 5.1 Registro y login (contraseñas)

**Qué archivos lo componen**

- `src/app/registro/page.tsx` + `RegistroClerkSignUp.tsx`  
- `src/app/login/` + `EmailPasswordSignIn.tsx`  
- `src/app/crear-contrasena/page.tsx`  
- `src/middleware.ts`  
- `src/lib/clerk-auth.ts`, `src/lib/auth.ts`, `src/lib/account-gate.ts`  
- `src/components/IdleSessionGuard.tsx` (cierra sesión tras ~30 min sin uso)

**Funciones / ideas importantes**

| Pieza | Qué hace |
|-------|----------|
| Clerk `<SignUp>` / `useSignIn` | Crear cuenta o entrar con email/password. |
| `ensureProfile` | Sincroniza usuario Clerk → fila en `profiles`. |
| `redirectIfPasswordMissing` | Si Clerk dice que no tiene password, lo manda a crearla. |
| `redirectIfNotApproved` | Si está pending/rejected o sin formulario, lo saca del área privada. |
| `getLoginAccountHint` | Tras un login fallido, puede explicar “cuenta pendiente/rechazada” (con límites anti-abuso). |

**Cómo se conecta con el resto**  
Sin sesión Clerk no pasás el middleware en rutas privadas. Sin fila en Neon no hay rol ni aprobación. El formulario y los filtros solo tienen sentido después.

---

### 5.2 Formulario (onboarding / perfil)

**Archivos**

- `src/lib/onboarding.ts` — lista de provincias, temáticas, validación  
- `OnboardingForm.tsx` — UI del cuestionario  
- `CompletarPerfilForm.tsx` — primera vez post-registro  
- `ProfileEditClient.tsx` / `CreatorSocialProfile.tsx` — editar después  
- `syncOnboarding` / `updateSelfProfile` — guardar en Neon  

**Qué hace**  
Recoge datos de persona/marca/creador y los escribe en `profiles`. Sin completarlo, no avanzás a “pendiente” de forma útil (el sistema te vuelve a mandar a completar).

**Conexión**  
Alimenta cómo te ven marcas/admin (nombre, @, temáticas) y qué podés hacer después.

---

### 5.3 Sistema de filtros

No es un solo archivo: son filtros distintos según la pantalla.

| Dónde | Qué filtra | Quién lo hace |
|-------|------------|---------------|
| `/eventos` | Categoría del evento | Navegador (`EventosFeedClient`); el servidor ya trae solo eventos `active` |
| Dashboard marca — lista eventos | Activos / borradores / finalizados | Navegador (`EventsListClient`) |
| Solicitudes de un evento | Pending / approved / rejected + búsqueda por nombre/@ | Navegador (`SolicitudesClient`) |
| Admin usuarios | Texto + rol | Servidor (`?q=`, consulta a Neon) |
| Admin postulaciones / eventos | Estado / pendientes | Servidor |

**Conexión**  
Los filtros no “inventan” datos: trabajan sobre lo que ya está en Neon (y a veces sobre una lista ya bajada al celular/computadora).

---

### 5.4 Integración con Instagram

**Qué hay hoy**

- Guardar y normalizar el handle (`@usuario`)  
- Link clickeable al perfil público  
- Número de seguidores **manual**  
- Inputs en onboarding, aplicar a evento y perfil  

**Archivos clave:** `src/lib/instagram.ts`, `InstagramHandleInput.tsx`, `InstagramLink.tsx`, usos en formularios y admin.

**Qué NO hay**

- Login con Instagram  
- Tokens de Meta/Instagram  
- Lectura automática de métricas vía API oficial  

**Conexión**  
El `@` identifica al creador frente a marcas. La autenticación real sigue siendo email/Clerk.

---

### 5.5 TikTok Connect (Login Kit)

**Qué hace (fase 1–2)**  
Los creadores ya logueados con Clerk pueden **vincular** su cuenta de TikTok desde `/mi-perfil`. No reemplaza el login de Connecta.

Flujo: Conectar → OAuth Login Kit → callback → guarda tokens + sincroniza `tiktok_handle` y `tiktok_followers` (+ `creator_meta.redes.TikTok`).

**Qué ya existe en el repo**

- Columnas OAuth en `profiles`: `tiktok_open_id`, `tiktok_access_token`, `tiktok_refresh_token`, `tiktok_token_expires_at`, `tiktok_connected_at`
- Migración: `drizzle/0008_tiktok_oauth.sql`
- `src/lib/tiktok.ts` + `src/lib/tiktok-profile.ts`
- Rutas: `/api/tiktok/connect`, `/api/tiktok/callback`
- UI en `/mi-perfil`: Conectar / Volver a sincronizar / Desconectar
- Campos manuales de TikTok siguen como fallback si no hay conexión

**Variables de entorno** (Vercel + `.env.local`; nunca en el front)

```
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_REDIRECT_URI=https://www.connectainf.com/api/tiktok/callback
```

**Checklist TikTok for Developers**

1. Producto **Login Kit** activo.
2. Scopes: `user.info.basic`, `user.info.profile`, `user.info.stats` (aprobados si pide review).
3. Redirect URIs **HTTPS estáticos** (TikTok no acepta `http://localhost`):
   - `https://www.connectainf.com/api/tiktok/callback`
   - `https://local.connectainf.com/api/tiktok/callback` (local con `npm run dev:prod-local`)
4. Para local: apuntar `TIKTOK_REDIRECT_URI` al callback de `local.connectainf.com` y registrar ese host en TikTok.

**Fuera de esta fase**

- Importar lista de videos (`video.list`)
- Entrar a Connecta solo con TikTok

También sigue existiendo el portfolio de posts con URL de TikTok → oEmbed (miniatura pública, sin OAuth).

---

## 6. Datos y seguridad

### Dónde se guarda qué

| Dato | Dónde vive |
|------|------------|
| Email + **contraseña** | **Clerk** (ellos hashean y custodian). |
| Perfil, rol, aprobación, eventos, postulaciones, posts | **Neon** (Postgres). |
| Fotos nuevas (avatar, eventos) | **Vercel Blob**; en Neon solo la URL. |
| Fotos viejas (antes del cambio) | Algunas siguen como data-URL dentro de Neon hasta que se reemplacen. |
| Quién es admin | Variable `ADMIN_EMAILS` en Vercel (no hardcodeado en el código). |
| Tokens TikTok OAuth | **Neon** (`tiktok_access_token` / `tiktok_refresh_token`), solo servidor; nunca al front. |
| Tokens Instagram | **No existen** (solo handle manual). |

### Contraseñas — ¿está bien?
**Sí, el enfoque es el correcto para este tipo de app:** no reinventar login. Clerk es un proveedor especializado. CONNECTA no debería (y no lo hace) guardar la contraseña en texto plano en Neon.

### Instagram/TikTok — ¿hay tokens expuestos?
Instagram: no hay OAuth; solo handles públicos.  
TikTok: los tokens viven en Neon y solo se usan en rutas/actions de servidor. No se envían al cliente.

### Riesgos que conviene conocer (sin alarmismo)

1. **Aprobación de cuentas:** un admin humano decide; si se aprueba de más, entran perfiles dudosos.  
2. **Links de invitación a eventos:** quien tenga el link puede ver/postularse según las reglas de la página; el token es largo y aleatorio, pero no compartas links en público si el evento es cerrado.  
3. **Datos del formulario:** email de contacto del form puede diferir del email de Clerk; edad/teléfono se validan poco.  
4. **Fotos públicas en Blob:** las URLs de imagen son accesibles si alguien tiene el link (normal en fotos de eventos).  
5. **Email de bienvenida:** todavía es un stub (no manda mail real).  
6. **Carpeta `supabase/`:** no confundirla con la base real (Neon).
7. **Tokens TikTok:** si se filtra `DATABASE_URL`, también se filtran refresh tokens; rotá Client Secret en TikTok si hay incidente.

En resumen: la base de auth está bien encaminada; los riesgos grandes de producto son más de **proceso** (quién aprueba, qué datos pedís) y del cuidado de secretos OAuth, no de “contraseñas en claro en el código”.

---

## 7. Glosario

| Término | Definición en una línea |
|---------|-------------------------|
| **API** | Forma en que dos sistemas se hablan (pedir/enviar datos) por internet. |
| **Backend** | La parte que corre en el servidor: reglas, base de datos, cosas que el usuario no ve. |
| **Blob / object storage** | Depósito de archivos (fotos) aparte de la base de datos. |
| **Clerk** | Servicio de login/registro y contraseñas. |
| **Deploy** | Publicar una versión nueva del sitio en internet (acá, en Vercel). |
| **Endpoint** | Una URL concreta del servidor que hace una acción (ej. subir imagen). |
| **Frontend** | Lo que se ve y se clickea en el navegador. |
| **Handle** | El usuario de red social, ej. `@juanita`. |
| **Hash / hashear** | Transformar la contraseña a un valor irreversible para guardarla con seguridad. |
| **Hook** | En React, función especial (`useState`, etc.) para estado o efectos en una pantalla. |
| **Middleware** | Código que se ejecuta antes de llegar a una página (ej. “¿estás logueado?”). |
| **Neon** | La base de datos PostgreSQL en la nube de CONNECTA. |
| **OAuth** | Sistema estándar de “entrar con Google/Instagram/…” dando permisos sin compartir la contraseña de esa red. |
| **oEmbed** | Forma pública de pedir una vista previa (ej. miniatura de un video de TikTok) sin login. |
| **ORM** | Capa (Drizzle) que facilita leer/escribir la base sin SQL crudo en todos lados. |
| **PostgreSQL** | Tipo de base de datos relacional (tablas, filas, columnas). |
| **Rol** | Tipo de usuario: admin, brand (marca) o creator. |
| **Server Action** | Función del servidor que la pantalla llama al guardar o enviar algo. |
| **Sesión** | Prueba de que ya iniciaste sesión (la mantiene Clerk). |
| **Stack** | Conjunto de tecnologías del proyecto. |
| **Token** | Código secreto o de un solo uso (login, invitación a evento, API). |
| **Variable de entorno** | Configuración secreta fuera del código (claves, URLs, emails admin). |
| **Vercel** | Empresa/plataforma que hostea el sitio y el Blob. |

---

## 8. Preguntas que me haría (y respuestas)

**1. ¿Dónde “vive” mi producto si se cae mi Mac?**  
En **Vercel** + **Neon** + **Clerk** + **Blob**. Tu computadora es solo para desarrollar; producción está en la nube.

**2. Si borro el código del repo, ¿se borran los usuarios?**  
No automáticamente. Los usuarios de login están en Clerk; los perfiles/eventos en Neon; las fotos nuevas en Blob. El código es la “máquina”; los datos están en esos servicios.

**3. ¿Por qué no puedo “loguearme con Instagram”?**  
Meta restringió mucho el login con Instagram para apps chicas. CONNECTA usa email/Clerk y guarda el `@` como identidad pública.

**4. ¿Quién puede entrar al panel `/admin`?**  
Quien tenga un email listado en la variable **`ADMIN_EMAILS`** de Vercel (y haya iniciado sesión). No se elige “soy admin” desde el formulario.

**5. ¿Una marca puede publicar un evento sola y que salga al toque?**  
Crea el evento en **borrador**. Un **admin** lo aprueba/publica para que pase a activo en el feed.

**6. ¿Los creadores ven todos los eventos?**  
Ven los que están en estado **active**. Pueden filtrar por categoría en el feed.

**7. ¿Qué pasa si alguien se registra y nunca completa el formulario?**  
Queda a mitad de camino: el sistema lo empuja a `/completar-perfil`. Sin eso no avanza bien al flujo de pendiente/uso.

**8. ¿TikTok ya está “conectado”?**  
Solo a nivel de **dato** (usuario, seguidores manuales, links y miniaturas públicas). No hay conexión oficial con cuenta TikTok vía API.

**9. ¿Es seguro guardar fotos?**  
Las nuevas van a Blob (mejor que hinchar la base). Las URLs son públicas si alguien las tiene: pensalo como fotos de un evento, no como documento secreto.

**10. ¿Qué debería preocuparme antes de escalar mucho?**  
Proceso de aprobación de cuentas, calidad de datos del formulario, costos de Neon/Blob/Clerk, y —cuando quieras métricas reales de IG/TikTok— el trabajo legal/técnico de OAuth y APIs de Meta/TikTok.

**11. ¿Para qué está la carpeta `mockups/`?**  
Diseños HTML de cómo se imaginó el producto. Útiles para mirar, no son la app que corre en connectainf.com.

**12. ¿Dónde leo la auditoría técnica más detallada?**  
En `docs/AUDITORIA-CONNECTA-FASE-1.md` (mapa, limpieza hecha, sugerencias de mejora).

---

## Cómo usar este documento

1. Leé §1–2 para el panorama.  
2. Usá §3 como índice cuando alguien diga “está en tal archivo”.  
3. SeguÍ §4 cuando quieras explicar el producto a un socio o inversor.  
4. Volvé a §5–6 cuando evalúes Instagram/TikTok o seguridad.  
5. Tené §7–8 a mano para conversaciones con el equipo técnico.

Si querés, el siguiente documento útil puede ser un **“manual operativo”** (cómo aprobar usuarios, publicar eventos, qué mirar si algo falla) sin hablar de código.
