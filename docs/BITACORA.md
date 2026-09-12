# Bitácora de cambios — CONNECTA

Acá anotamos qué cambiamos, cuándo, quién y por qué.

**Para qué sirve:** que cualquiera que agarra el proyecto (hoy o en seis meses) entienda en qué estado está y cómo se llegó hasta acá, sin tener que leer 28 commits ni preguntarle a alguien. Si algo se rompe, acá está el rastro de qué se tocó último.

**Regla:** todo cambio que se sube a `main` se anota acá **en el mismo commit** que el cambio. No después, no "cuando tenga tiempo". Si no está en la bitácora, para el equipo no pasó. Ver [REGLAS-DE-ORO.md](REGLAS-DE-ORO.md).

---

## Cómo agregar una entrada

Copiá este bloque arriba de todo en "Registro" (el más nuevo va **primero**):

```markdown
## AAAA-MM-DD — `hash corto` — Tu nombre

**Qué cambié:** una o dos frases, en castellano, que entienda alguien que no programó esto.

**Por qué:** el problema real que resuelve. Si fue un pedido de alguien, decí de quién.

**Dónde:** los archivos principales que tocaste.

**Cómo probarlo:** los pasos concretos para verificar que anda.

**Riesgo / qué mirar:** qué se puede haber roto de rebote. Si no hay riesgo, poné "bajo" y explicá por qué.
```

Reglas de la entrada:

- **En castellano.** La bitácora la leen todos, no solo quien programa.
- **Sin jerga innecesaria.** "Arreglé el login que se quedaba cargando" es mejor que "fix async race en el auth provider".
- **Una entrada por cambio con sentido propio**, no una por commit. Si hiciste 4 commits para una misma cosa, es una sola entrada.
- **El hash lo ponés después de commitear.** Hacé el commit, corré `git log -1 --format=%h` y anotalo en la entrada. **No uses `git commit --amend` para eso:** amend crea un commit nuevo con otro hash, así que el que acabás de pegar queda viejo. Va en un commit chiquito aparte.
- **Si tocaste la base de datos, decilo con todas las letras** y nombrá la migración. Es el cambio que más caro sale de revertir.

---

# Registro

<!-- Las entradas nuevas van ACÁ ARRIBA, la más reciente primero. -->

---

## 2026-09-12 — `86696df` — Camila Sylvester

**Qué cambié:** teléfono celular argentino obligatorio en registro/onboarding (creadores y marcas), opcional al editar perfiles que ya existen; reordené el onboarding del creador (Datos básicos → Redes → Sobre vos → Categorías → Revisión); en el perfil del creador hay link directo a WhatsApp (`wa.me`) cuando hay número válido (tareas **T-12** + **T-13**).

**Por qué:** hace falta el celular para contactar, y conviene pedir el teléfono junto con el reorder del formulario. Quienes ya están en la plataforma pueden cargarlo sin quedar bloqueados.

**Dónde:** `src/lib/phone.ts`, `src/lib/onboarding.ts`, `src/lib/creator-registro-v3.ts`, `src/components/RegistroCreadorV3Form.tsx`, `src/components/OnboardingForm.tsx`, `src/components/CreatorSocialProfile.tsx`, `src/components/ProfileEditClient.tsx`, `src/components/CompletarPerfilForm.tsx`, `src/app/after-auth/actions.ts`, `src/app/actions.ts`, `src/app/dashboard/creadores/[id]/page.tsx`.

**Cómo probarlo:** (1) registro creador: paso 1 pide celular AR válido y el orden de pasos es el nuevo; (2) onboarding marca: mismo campo obligatorio; (3) editar perfil existente: celular opcional; (4) con teléfono cargado, en perfil social y en `/dashboard/creadores/[id]` aparece “WhatsApp” y abre `wa.me`.

**Riesgo / qué mirar:** bajo. Usuarios viejos sin teléfono pueden seguir editando; altas nuevas sí lo necesitan. Revisar que números con `15` viejo o fijos no pasen (solo móvil 10 dígitos nacionales).

---

## 2026-09-12 — `0b94740` — Camila Sylvester

**Qué cambié:** unifiqué el login de desktop con el formato acordado (tarea **T-35**): layout de escritorio (aside + formulario), primero Creador/Marca en chips más quietos, después Iniciar sesión/Crear cuenta en pill, solo logo (sin “Volver a la landing”), y el texto de la izquierda ya no salta al cambiar de Creador a Marca.

**Por qué:** pedían el mismo flujo que mobile pero con cara de login de escritorio, y distinta jerarquía visual entre “quién sos” y “qué querés hacer”.

**Dónde:** `src/app/auth.css`, `src/components/AuthEntry.tsx`, `src/components/AuthFrame.tsx`.

**Cómo probarlo:** abrir `/login` en desktop (≥641px). Verificar orden rol → sesión, chips vs pill, logo → home, y que al pasar Creador ↔ Marca el copy del aside no se mueva.

**Riesgo / qué mirar:** bajo. Mobile ya tenía su CSS; revisar que los pills de mobile sigan bien.

---

## 2026-09-12 — `9f2c81a` — Camila Sylvester

**Qué cambié:** en `/eventos` mobile, **Ingresar** (y Crear cuenta) quedaron fijos en la barra de arriba; ya no van adentro del menú desplegable (tarea **T-01**). El menú solo deja los links de navegación. Si hay sesión, Cerrar sesión también se ve en la barra.

**Por qué:** en mobile el login estaba escondido en el desplegable y en desktop ya se veía bien. Pedido de producto para que se pueda entrar sin abrir el Menú.

**Dónde:** `src/app/eventos/page.tsx`, `src/app/eventos/eventos-feed.css`.

**Cómo probarlo:** abrir `/eventos` con viewport ≤860px, sin sesión: tienen que verse Ingresar y Crear cuenta en la barra, y el Menú sin esos links. Con sesión: Cerrar sesión en la barra; Mis postulaciones / perfil en el Menú.

**Riesgo / qué mirar:** bajo. Solo layout del header del feed; desktop no cambia la lógica.

---

## 2026-09-12 — `570a7fc` — Camila Sylvester

**Qué cambié:** rediseñé el inicio de sesión / crear cuenta **solo en mobile** (tarea **T-34**): logo Connecta grande que vuelve al inicio, sin botón “Volver a la landing”, primero el toggle Creador/Marca y después Iniciar sesión/Crear cuenta. La estética sigue el manual de marca (fondo de la landing, Inter, morado). Desktop no se tocó.

**Por qué:** pedido de producto para ordenar el flujo en el celular y alinear la pantalla de auth con la marca, sin copiar la estética del mock de referencia (solo el formato).

**Dónde:** `src/app/auth.css`, `src/components/AuthEntry.tsx`, `src/components/AuthFrame.tsx`, `src/components/Logo.tsx`.

**Cómo probarlo:** abrir `/login` en viewport ≤640px (o el celular). Verificar logo grande → home, orden de toggles, tipografía/colores como la landing. En desktop (≥641px) el layout anterior debe seguir igual.

**Riesgo / qué mirar:** bajo. Solo CSS y orden de controles en mobile; los flujos de Clerk / Instagram no cambian.

---

## 2026-09-12 — `b5e8a4c` — Camila Sylvester

**Qué cambié:** saqué el cierre automático de sesión por inactividad (tarea **T-02**). `IdleSessionGuard` ya no se monta en el layout; el archivo queda por si hay que reactivarlo. La sesión no se cierra sola a los 30 minutos con la pestaña abierta.

**Por qué:** pedido de producto: mantener la sesión iniciada. Amadeo había diagnosticado en TAREAS que el timeout de 30 min era a propósito (seguridad), no un bug de Clerk. Se decidió desactivarlo.

**Dónde:** `src/app/layout.tsx`, `src/components/IdleSessionGuard.tsx`, `ENTENDER_PROYECTO.md`.

**Cómo probarlo:** iniciar sesión, dejar la pestaña abierta más de 30 minutos sin tocar nada, volver: tiene que seguir logueada. (Revisar también Clerk Dashboard → Sessions: inactivity / lifetime, que es aparte.)

**Riesgo / qué mirar:** bajo en código. En PCs compartidas la sesión puede quedar abierta más tiempo; si hace falta política de seguridad, se reactiva el guard o se configura en Clerk.

---

## 2026-09-09 — `f5ab301` — Amadeo

**Qué cambié:** escribí [TAREAS.md](TAREAS.md) con las 33 tareas del pedido de correcciones y mejoras, priorizadas y estimadas. Armé el mismo contenido en un Excel para pasarlo afuera del repo.

**Por qué:** me llegó el pedido en un documento corrido, sin prioridades ni estimaciones. Antes de estimar me metí en el código para ver qué de lo que piden ya está hecho, y encontré varias cosas a medio hacer que bajan bastante el trabajo: las solicitudes ya muestran nombre y arroba, el export CSV ya existe para admin, el footer ya tiene los links legales y la foto de perfil automática ya funciona con TikTok.

De paso ubiqué la causa de tres problemas que venían reportados sin diagnóstico:

- La sesión que se cierra sola es `IDLE_TIMEOUT_MINUTES = 30` en `IdleSessionGuard.tsx`. Está puesto a propósito, no es un bug.
- Las imágenes de eventos salen con bordes por el `aspect-ratio: 4 / 5` de `eventos-feed.css:365`.
- El mail de bienvenida no llega porque `welcome-email.ts` es un stub vacío, nunca conectamos proveedor.

**Dónde:** `docs/TAREAS.md`.

**Ojo:** el Excel lo dejo fuera del repo a propósito. Un `.xlsx` no se puede diffear ni mergear, así que si lo editamos dos a la vez uno pisa al otro. La fuente que vale es el `.md`.

**Riesgo:** ninguno, es documentación.

---

## 2026-09-09 — `f5ab301` — Amadeo

**Qué cambié:** armé esta bitácora y escribí [REGLAS-DE-ORO.md](REGLAS-DE-ORO.md) con las normas de trabajo del equipo.

**Por qué:** somos varios tocando el mismo repo y hasta ahora yo no tenía forma de saber qué había hecho el otro sin leerme el historial commit por commit. Además, revisando el historial me encontré con un choque entre dos personas trabajando sobre `main` el mismo día (el merge `3abb3d6` del 19/08 es la marca de eso). Las reglas apuntan a que no vuelva a pasar.

**Dónde:** `docs/BITACORA.md`, `docs/REGLAS-DE-ORO.md`.

**Riesgo:** ninguno, es documentación. No toca código.

---

> ## ⬇ Todo lo de abajo es historia reconstruida
>
> Las entradas que siguen **no** se escribieron en el momento: las reconstruí el 2026-09-09 leyendo el historial de git. Son fieles a lo que dice cada commit y a los archivos que tocó, pero **no tienen el contexto de por qué se hizo** ni cómo se probó, porque eso nunca quedó escrito.
>
> Sirven para ubicarse en la historia del proyecto. De acá en adelante escribimos cada entrada cuando hacemos el cambio, completa.

---

## 2026-09-01 — `449abb0`, `17d4142`, `c0b65a4` — Camila Sylvester

Tres cambios en el mismo día, dos de ellos de seguridad.

**`449abb0` — Rate limit en el login por handle de Instagram.**
Antes se podía usar la pantalla de login para averiguar qué emails están registrados, probando handles de Instagram uno atrás de otro. Ahora hay un límite de intentos y una demora mínima de respuesta, así no se puede sacar la lista de emails a fuerza de probar.
→ `src/app/login/actions.ts`

**`17d4142` — Una marca podía modificar postulaciones de eventos de otra marca.**
Faltaba verificar que el evento fuera de quien lo estaba modificando. Se agregó el chequeo. Cambio de 6 líneas, pero era un agujero serio: cualquier marca podía tocar datos ajenos.
→ `src/app/actions.ts`

**`c0b65a4` — Exportar creadores a CSV desde el panel de admin.**
Un botón en `/admin/usuarios` que baja emails y teléfonos de los creadores, para mandar el newsletter. El CSV sale con BOM para que Excel abra bien los acentos.
→ `src/app/api/admin/export-creators/route.ts`, `src/components/AdminExportCreatorsButton.tsx`, `src/lib/csv-export.ts`, `src/app/admin/usuarios/page.tsx`

---

## 2026-08-27 — `14fe1ee` — damasia

**Qué cambió:** los emails que están en la lista de admins (`ADMIN_EMAILS`) ya no pierden el rol de admin cuando vuelven a loguearse.

**Por qué:** a Fran lo bajaban de admin cada vez que entraba.

**Dónde:** 2 archivos, 20 líneas.

---

## 2026-08-21 — `ddac2a5` — Camila Sylvester

**Qué cambió:** los links de invitación ahora usan `www.connectainf.com` en vez de la URL de Vercel (`*.vercel.app`).

**Por qué:** los links de invitación y Clerk se rompen en el dominio de vercel.app. Quedó anotado en `.env.local.example` como advertencia para que nadie lo vuelva a poner.

**Dónde:** 15 archivos, ~890 líneas.

---

## 2026-08-20 — `a0b168c`, `0bce02c`, `d479d00`, `dc2c835` — Camila Sylvester

Día de UI y de páginas legales.

- **`a0b168c`** — Páginas legales del pie: términos, privacidad, defensa del consumidor, seguridad y contacto. 15 archivos, ~619 líneas.
- **`0bce02c`** — El paso de contraseña mostraba la pantalla de email de Clerk en vez del campo de contraseña. Arreglado.
- **`d479d00`** — El layout de login/registro se ensanchó para escritorio, con un panel de marca al costado.
- **`dc2c835`** — Se rehízo el portfolio del creador para que ocupe todo el ancho en escritorio. ~291 líneas.

---

## 2026-08-19 — `9afc0e2`, `e71939a`, `49fe8b0`, `c642076`, `b0618cd`, `487a3f2`, `8997540`, `b755539`, `cd98a4b`, `3abb3d6` — Camila Sylvester y damasia

El día más movido del proyecto: 10 commits, dos personas en paralelo.

- **`9afc0e2`** — El más grande (30 archivos, ~1597 líneas): flujo de creador pendiente de aprobación, textos honestos para marcas, y buscador de creadores.
- **`e71939a` + `49fe8b0`** — El login se quedaba clavado en "Cargando". Se reemplazó el formulario propio por el componente `SignIn` de Clerk, y después se arregló el caso específico de la URL de Vercel.
- **`c642076`** — El login de Clerk se puso en castellano y con el oscuro legible de Connecta.
- **`b0618cd`** — Los creadores ahora pueden postularse a eventos antes de que les aprueben la cuenta.
- **`487a3f2`** — damasia arregló los chips de ubicación, género e idioma del registro.
- **`8997540` + `b755539`** — Se agregaron `robots.txt` y `sitemap.xml`; después se sacó `/login` del sitemap (no tiene por qué estar indexado).
- **`cd98a4b`** — "Creadores" abre en Explorar en vez de la lista tipo CRM.
- **`3abb3d6`** — ⚠️ **Merge automático.** No es un cambio: es la marca de que dos personas pushearon a `main` el mismo día y git tuvo que unir las dos ramas. Es exactamente lo que las reglas de oro buscan evitar.

---

## 2026-08-18 — `f404a90` — damasia

**Qué cambió:** arreglo del registro — el botón de Google se veía ilegible y había cuentas que no terminaban de crearse.

**Dónde:** 13 archivos, ~328 líneas.

---

## 2026-08-13 y 14 — `63a5090`, `3d8b26a`, `a36e7a3`, `a81bb0e`, `d39635a` — damasia y Camila Sylvester

Primeros retoques después de publicar.

- **`63a5090`** — "Crear cuenta" rehecho. 11 archivos, ~1631 líneas.
- **`3d8b26a`** — Después de loguearse, la app tiraba un 404 de Clerk. Ahora redirige a `/login`.
- **`a36e7a3`** — Se sacó el buscador del panel izquierdo.
- **`a81bb0e`** — El filtro "Arte" se movió al final de la lista de categorías.
- **`d39635a`** — Cambio de Delfi Cardona, categoría Fitness.

---

## 2026-08-11 — `0b4438b` — Camila Sylvester

**Qué cambió:** se publicó la app CONNECTA completa y funcionando en este repo compartido.

**Qué trajo:** todo el proyecto Next.js (App Router + TypeScript + Tailwind), el esquema de base con Drizzle y sus 7 migraciones, autenticación con Clerk, subida de imágenes con Vercel Blob, los paneles de admin, marca y creador, y la documentación (`README.md`, `DEPLOY.md`, `ENTENDER_PROYECTO.md`, `docs/AUDITORIA-CONNECTA-FASE-1.md`).

**Es el punto de partida real del proyecto.** Todo lo anterior eran mockups.

---

## 2026-07-17 — `f10eaf9`, `05a5d29` — herrerasegundo1

**Qué cambió:** los mockups en HTML del arranque — landing, dashboard de marca y pantalla de creadores/eventos — más el README inicial.

**Dónde:** hoy viven en [`mockups/`](../mockups/) como referencia visual.
