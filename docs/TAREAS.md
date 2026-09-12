# Tareas — Correcciones y mejoras de plataforma

Me pasaron este pedido el 2026-09-09. Lo abrí en 33 tareas, las ordené por prioridad y les puse tiempo estimado.

**Cómo usar este archivo:**

- Cada tarea tiene un **ID** (`T-01`, `T-02`…). Usalo en el commit y en la bitácora: `fix: T-02 mantener la sesión iniciada`. Así se puede rastrear cualquier cambio hasta el pedido que lo originó.
- Cuando termines una tarea, **completá su línea `Hecho`** con fecha, quién, hash del commit y qué se hizo realmente (si terminó siendo distinto de lo planeado, escribí lo que pasó, no lo que decía el plan).
- **No borres las tareas terminadas.** Quedan como registro. La bitácora cuenta el cambio; acá queda el pedido y su cierre.
- El campo **`Hoy`** dice cómo está el código: lo verifiqué yo el 2026-09-09 contra el repo. Si pasó tiempo desde entonces, chequealo de nuevo antes de arrancar.

Ver [REGLAS-DE-ORO.md](REGLAS-DE-ORO.md) y [BITACORA.md](BITACORA.md).

---

## Estado actual de la aplicación

Antes de estimar, revisé el código. Lo que encontré:

**Lo que ya está construido y funciona:** el registro de creadores por Instagram con un onboarding de 5 pasos, el registro de marcas por email, los tres paneles (admin, marca, creador), la publicación de eventos con link privado de invitación, las postulaciones, la subida de imágenes a Vercel Blob, el feed de publicaciones del creador, las páginas legales, el buscador de creadores para marcas (`/dashboard/explorar`) y una integración con TikTok por OAuth.

**Cosas del pedido que ya están hechas o a medio hacer** — esto baja el costo de varias tareas:

| Pedido | Estado real |
|---|---|
| Solicitudes con nombre, @IG y link al perfil | **Ya está.** Solo falta la foto de perfil (hoy muestra iniciales de color) |
| Export CSV | **Ya existe** para admin (`c0b65a4`). Falta la versión para marcas, con TikTok |
| Footer con links legales | **Ya está.** Faltan Instagram, LinkedIn y mail |
| Foto de perfil automática | **Ya funciona con TikTok** (`src/lib/tiktok.ts`). Instagram es otra historia — ver T-18 |
| Teléfono, ubicación, edad | **Ya están en la base** (`profiles`). Falta pedirlos y validarlos en el formulario |

**Las tres causas concretas de los problemas reportados:**

1. **La sesión se cierra sola** → ~~`IdleSessionGuard` a 30 min~~ **Resuelto 2026-09-12** (`b5e8a4c`): el guard se desmontó. Queda revisar timeouts en Clerk Dashboard.
2. **Las imágenes de eventos aparecen enmarcadas** → `eventos-feed.css:365` fuerza `aspect-ratio: 4/5` con `object-fit: contain`. De ahí los bordes.
3. **El mail de bienvenida no llega** → `src/lib/welcome-email.ts` es un stub vacío con un `TODO`. Nunca se conectó un proveedor de mail.

**Lo que hay que construir de cero** (no existe nada): perfil de marca, solicitudes directas de colaboración, sección Explorar general, brief automático, recomendaciones, y los campos de agencia / descripción / marcas con las que trabajó.

---

## Cómo leer las estimaciones

| Sigla | Tiempo | Referencia |
|---|---|---|
| `XS` | Menos de 1 hora | Cambiar una constante, un texto |
| `S` | 1 a 3 horas | Un ajuste de CSS, un campo nuevo en un formulario |
| `M` | Medio día a 1 día | Migración de base + formulario + mostrarlo |
| `L` | 2 a 3 días | Función nueva completa, con varias pantallas |
| `XL` | 1 semana o más | Sección nueva de la plataforma |

Supuestos: **una persona trabajando**, sin interrupciones, contando el tiempo de probarlo. Si son dos en paralelo no se divide por dos — las tareas de una misma zona se pisan.

**Total estimado: 265 a 395 horas, o sea 9 a 13 semanas de una persona** para las 33 tareas. Tengo el mismo detalle en un Excel aparte, para pasarlo afuera del repo (lo dejo fuera de git a propósito: un `.xlsx` no se puede mergear).

| Cuadrante | Tareas | Tiempo |
|---|---|---|
| 🔴 Importante y urgente | 6 | 22 a 32 h (4 a 5 días) |
| 🟡 Importante no urgente | 19 | 191 a 288 h (6 a 10 semanas) |
| 🔵 Urgente no importante | 4 | 13 a 19 h (2 a 3 días) |
| ⚪ Ni importante ni urgente | 4 | 39 a 57 h (1 a 2 semanas) |

---

# 🔴 Importante y urgente

> Afecta a usuarios reales **hoy**, o es una obligación legal. Se hace esta semana.
> **Son 6 tareas y suman 4 o 5 días.** Es el mejor retorno de todo el documento.

### T-02 · Mantener la sesión iniciada — `XS`

**Hoy:** `IdleSessionGuard.tsx` cierra la sesión a los **30 minutos** sin mover el mouse. El usuario vuelve a la pestaña y está afuera, con el mensaje "Cerramos tu sesión por inactividad".

**Hacer:** subir `IDLE_TIMEOUT_MINUTES` a un valor razonable (¿7 días?) o sacar el guard entero. Además, revisar el *Inactivity timeout* y el *Session lifetime* en el Dashboard de Clerk — controla las pestañas cerradas y es una configuración aparte del código.

**Archivos:** `src/components/IdleSessionGuard.tsx` + Clerk Dashboard.

**Ojo:** el guard lo agregó alguien por algún motivo. Si fue por seguridad (sesiones abiertas en compus compartidas), esa decisión no la tomo yo solo. Lo pregunto antes de tocarlo.

**Hecho:** ✅ 2026-09-12 — Camila Sylvester — `b5e8a4c`. Se desmontó `IdleSessionGuard` del layout (no se subió el timeout: se sacó el cierre por inactividad en cliente). Pendiente revisar Inactivity timeout / Session lifetime en Clerk Dashboard.

### T-01 · Login visible en mobile — `XS`

**Hoy:** en mobile el "Ingresar" está adentro de un `<details className="feed-mobile-menu">`, o sea escondido en el desplegable (`src/app/eventos/page.tsx`). En desktop sí está a la vista.

**Hacer:** sacar el botón de sesión del desplegable y dejarlo fijo en la barra de navegación en mobile.

**Archivos:** `src/app/eventos/page.tsx`, `src/app/eventos/eventos-feed.css`.

**Hecho:** ✅ 2026-09-12 — Camila Sylvester — `9f2c81a`. Ingresar y Crear cuenta quedan fijos en la barra en mobile; el menú solo tiene los links de la página (Eventos / Cómo postularte). Si hay sesión, Cerrar sesión también queda en la barra.

**Hoy:** reportado como "problemas de scrolleo durante la carga/visualización de publicaciones". Lo más probable es el modal de `CreatorFeed.tsx:131` (`max-h-[85vh] overflow-auto`), que se queda con el scroll o no bloquea el del fondo.

**Hacer:** **primero reproducirlo** — hace falta saber si pasa en mobile, en desktop o en los dos, y si es al abrir el modal o al cargar el feed. Sin reproducirlo no se puede estimar bien.

**Archivos:** `src/components/CreatorFeed.tsx`.

**Es urgente** porque es lo único de la lista que impide usar la app, no solo molesta.

**Hecho:** ⬜

---

### T-13 · Teléfono obligatorio — `S`

**Hoy (cerrado):** el celular AR es obligatorio en registro/onboarding (creador y marca). Cuentas viejas sin teléfono quedan bloqueadas en `/completar-telefono` hasta cargarlo. En edición también es obligatorio. En el perfil del creador hay link a WhatsApp.

**Pedido original:** agregar el campo al onboarding y hacerlo obligatorio, con validación de formato argentino.

**Es urgente** porque cada día que pasa entran creadores sin teléfono y después hay que salir a pedirlo uno por uno.

**Depende de:** conviene hacerla junto con T-12 (reordenar el onboarding), es el mismo formulario.

**Hecho:** ✅ 2026-09-12 — Camila Sylvester — `86696df` (campo + WhatsApp) + `0664b40` (bloqueo al entrar). Decisión de producto: **obligatorio a completar al entrar**, no opcional para cuentas existentes.

---

### T-05 · Aceptar Términos y Condiciones en el registro — `M`

**Hoy:** las páginas legales existen (`/terminos`, `/privacidad`) y están en el footer, pero **en ningún momento se le pide al usuario que las acepte**.

**Hacer:** checkbox obligatorio en el registro (creador y marca), con link que abra los términos en una pestaña nueva. Guardar en la base **cuándo** aceptó y **qué versión** — sin eso, el checkbox no sirve como prueba.

**Requiere migración:** `0009_terms_accepted.sql` → `terms_accepted_at`, `terms_version`.

**Es urgente por obligación legal**, no por producto: hoy se están procesando datos personales (teléfono, email, redes) sin consentimiento registrado.

**Hecho:** ⬜

---

### T-04 · Mail de bienvenida y confirmación — `M`

**Hoy:** `src/lib/welcome-email.ts` es un stub vacío: recibe el perfil y no hace nada. El comentario dice que se llama cuando un admin **aprueba** una cuenta — pero el pedido es mandarlo **al crearla**. Son dos momentos distintos; hay que decidir si son dos mails o uno.

**Hacer:** conectar Resend (o similar), armar la plantilla, y dispararlo al crear la cuenta.

**Ojo con el tiempo:** verificar el dominio `connectainf.com` para mandar mails requiere **cargar registros DNS y esperar la propagación**. Eso puede tardar horas o un día, y no depende de programar. Arrancá por ahí.

**Archivos:** `src/lib/welcome-email.ts`, `src/app/after-auth/actions.ts`.

**Hecho:** ⬜

---

# 🟡 Importante no urgente

> El grueso del producto. No se rompe nada si no se hace hoy, pero es lo que hace crecer la plataforma. **Ordenadas en el orden en que conviene hacerlas.**

## Bloque A — Terminar el perfil del creador

> Estas seis van juntas: son el mismo formulario y varias comparten migración. Hacerlas de a una cuesta el doble. **Agrupalas en una sola migración `0010_creator_profile.sql`.**

### T-12 · Reordenar los pasos del onboarding — `M`

**Hoy:** el orden es Sobre vos → Categorías → Tus redes → Revisión → Crear acceso (`RegistroCreadorV3Form.tsx:23-26`).

**Hacer:** pasar a Datos básicos → Redes sociales → Sobre vos → Categorías → Revisión. Implica partir el paso "Sobre vos" actual en dos y subir "Tus redes".

**Hecho:** ✅ 2026-09-12 — Camila Sylvester — `86696df`. Orden: Datos básicos → Redes → Sobre vos → Categorías → Revisión (+ Crear acceso).

---

### T-14 · Ubicación: todas las provincias + buscador — `M`

**Hoy:** `UBICACION_OPTIONS` tiene 6 valores sueltos y mezclados (`CABA`, `Palermo`, `Córdoba`, `Rosario`, `La Plata`, `Mendoza`) — hay una provincia, una ciudad y un barrio en la misma lista.

**Hacer:** las 23 provincias + CABA, más GBA Norte, GBA Sur y La Plata. Con autocomplete, no un desplegable largo.

**Decidir antes de programar:** ¿provincia y ciudad son dos campos separados (`province` y `city` ya existen en la base) o un solo campo tipo buscador? Cambia bastante la implementación.

**Hecho:** ⬜

---

### T-15 · Fecha de nacimiento y edad automática — `M`

**Hoy:** existe `age` (número) en la base. No hay fecha de nacimiento.

**Hacer:** agregar `birth_date`, calcular la edad a partir de ella y dejar de guardar `age` como dato suelto — si no, a los seis meses la edad guardada está mal.

**Requiere migración** + migrar los datos existentes de `age`.

**Hecho:** ⬜

---

### T-16 · Campo agencia — `M`

**Hoy:** no existe.

**Hacer:** "¿Tenés agencia?" (Sí/No) y, si es Sí, el nombre. **Requiere migración:** `has_agency`, `agency_name`.

**Hecho:** ⬜

---

### T-20 · Descripción de perfil — `M`

**Hoy:** no hay ningún campo de texto libre para que el creador se presente.

**Hacer:** campo `bio` (con límite de caracteres) en el onboarding y en la edición de perfil, y mostrarlo en el perfil público.

**Hecho:** ⬜

---

### T-21 · Marcas con las que trabajó — `M`

**Hoy:** no existe.

**Hacer:** campo tipo pastillas/tags para cargar marcas. Guardar como `jsonb` (igual que `contentThemes`, que ya usa ese patrón).

**A definir:** ¿texto libre o solo marcas que ya están en Connecta? Texto libre es más rápido y se llena más; vincularlas sirve para las recomendaciones de T-31 más adelante.

**Hecho:** ⬜

---

## Bloque B — Arreglos visibles de eventos y perfiles

### T-07 · Imágenes de evento adaptativas — `M`

**Hoy:** `eventos-feed.css:365` fuerza `aspect-ratio: 4 / 5` y `object-fit: contain`. Por eso una imagen horizontal queda con bordes arriba y abajo.

**Hacer:** respetar la proporción original de lo que sube la marca (9:16, cuadrada, horizontal).

**Ojo:** un feed con imágenes de alturas distintas se desarma visualmente. Conviene resolverlo con masonry o un rango de proporciones permitidas (ej. entre 4:5 y 16:9) en vez de dejarlo totalmente libre.

**Hecho:** ⬜

---

### T-09 · Foto de perfil en las solicitudes — `S`

**Hoy:** **casi todo hecho.** `SolicitudesClient.tsx` ya muestra nombre, @ de Instagram, link a Instagram y link al perfil interno. Lo único que falta: usa iniciales de color (`avatarColor`, `initialsFromName`) en vez de la foto real. No lee `avatarUrl`.

**Hacer:** mostrar `avatarUrl` cuando exista, con las iniciales de respaldo.

**Hecho:** ⬜

---

### T-19 · Cambiar la foto de perfil manualmente — `M`

**Hoy:** `avatarUrl` se llena solo desde TikTok o en el onboarding. `ProfileEditClient.tsx` **no** tiene subida de imagen.

**Hacer:** subida de foto en la edición de perfil, reusando `src/lib/blob-upload.ts` y `image-compress.ts` (ya se usan para las imágenes de eventos).

**Hecho:** ⬜

---

### T-27 · Contador de publicaciones — `S`

**Hoy:** la tabla `creator_posts` existe. No hay contador en el perfil.

**Hacer:** contar las publicaciones del creador y mostrarlo. Calcularlo con un `count` sobre la tabla, no guardar un número aparte — un contador guardado se desincroniza apenas se borra una publicación.

**Hecho:** ⬜

---

### T-28 · Contador de colaboraciones — `S`

**Hacer:** contar las `applications` en estado `approved` del creador. Mismo criterio que arriba: calcular, no guardar.

**Hecho:** ⬜

---

### T-10 · Export CSV de perfiles aceptados, para marcas — `S`

**Hoy:** ya existe el export para admin (`/api/admin/export-creators`) y el helper `src/lib/csv-export.ts`. Es copiar el patrón.

**Hacer:** que la marca baje los aceptados de su evento con nombre, Instagram, link de Instagram, TikTok y link de TikTok.

**Ojo — es la tarea más delicada de esta lista:** entrega datos personales a un tercero. Verificar **sí o sí** que la marca solo pueda exportar los aceptados de *sus propios* eventos. Es exactamente el agujero que se arregló en `17d4142` el 01/09.

**Hecho:** ⬜

---

### T-23 · Categorías más visuales — `M`

**Hoy:** `CATEGORY_TREE` tiene una estructura rica (categoría → subnichos) pero la interfaz es una lista.

**Hacer:** cards, íconos o botones seleccionables, más el texto explicativo de por qué conviene ser preciso ("las marcas te buscan con estos filtros").

**Hecho:** ⬜

---

## Bloque C — Funciones nuevas

### T-03 · Registro e inicio de sesión con Google — `M`

**Hoy:** el registro usa el componente `SignUp` de Clerk, que **ya soporta Google**: en buena medida es activarlo en el Dashboard de Clerk.

**El trabajo real no es el botón:** hoy el flujo del creador arranca pidiendo el Instagram y el de la marca el nombre. Con Google, el usuario entra directo sin pasar por ahí. Hay que resolver dónde se le pregunta si es creador o marca, y dónde se le pide el Instagram.

**Hecho:** ⬜

---

### T-08 · Brief automático para marcas — `L`

**Hacer:** al crear un evento, un formulario de preguntas que genere el brief de la acción.

**❓ Hay que definir antes de estimar en serio:** "generar automáticamente" puede ser (a) armar un texto con una plantilla a partir de las respuestas — 1 día, sin costo, resultado predecible; o (b) generarlo con IA — más flexible, pero suma costo por evento, latencia y resultados que hay que revisar. Son dos proyectos distintos. **Esta la tiene que contestar quien pidió la función; yo no la puedo decidir por mi cuenta.**

**Hecho:** ⬜

---

### T-30 · Solicitudes directas de colaboración — `L`

**Hacer:** que un creador pueda decir "quiero colaborar con esta marca" sin que haya evento publicado, y que la marca reciba esas solicitudes en su panel.

**Requiere:** tabla nueva (`collaboration_requests`), la acción del lado del creador y la bandeja del lado de la marca.

**Depende de T-29** — sin perfil de marca no hay dónde poner el botón.

**Hecho:** ⬜

---

### T-29 · Perfil completo de marca — `XL`

**Hoy:** las marcas tienen apenas `brandName`, `industry`, `companyLocation` y `contactPerson`. **No existe una página de perfil de marca.** Los creadores no pueden ver quién es la marca.

**Hacer:** logo, nombre, descripción, a qué se dedica, redes, web, ubicación, y que la marca pueda cargar publicaciones en su propio feed.

**Es la tarea más grande del documento y desbloquea otras tres** (T-25, T-30, y parte de T-33). Si hay que elegir una sola cosa grande para el próximo mes, es esta.

**Requiere migración** + páginas nuevas + reusar el feed de publicaciones que ya existe para creadores.

**Hecho:** ⬜

---

### T-33 · Sección Explorar general — `XL`

**Hacer:** una sección de descubrimiento tipo "lupa" de Instagram: marcas nuevas, creadores nuevos, eventos nuevos, publicaciones recientes, perfiles destacados, más un buscador único de marcas / creadores / eventos.

**Hoy existe** `/dashboard/explorar` pero es solo el buscador de creadores **para marcas**. Sirve como base, no como reemplazo.

**Ojo:** una sección de descubrimiento con pocos usuarios se ve vacía y juega en contra. Conviene hacerla cuando haya volumen, o arrancar por la barra de búsqueda unificada (`M`) y dejar el feed de novedades para después.

**Hecho:** ⬜

---

### T-18 · Foto de perfil automática desde Instagram — `L` ⚠️

**Hoy:** ya funciona **con TikTok** (`src/lib/tiktok.ts` trae la foto al conectar la cuenta). Con Instagram no hay nada: `src/lib/instagram.ts` solo arma URLs y normaliza el @.

**⚠️ Probablemente no se pueda como está pedido.** Instagram no entrega la foto de perfil de un usuario cualquiera a partir del @. Hace falta que *cada creador* conecte su cuenta por OAuth con la Instagram Graph API, lo que exige cuenta Business o Creator, una app de Meta y pasar la revisión de Meta. Bajar la foto scrapeando el perfil viola los términos de Instagram y se rompe cada vez que cambian el HTML.

**Las opciones reales son:** (a) hacer el OAuth de Instagram bien hecho — es `L` o más, y depende de la aprobación de Meta; (b) resolverlo con T-19, que el creador suba su foto; (c) dejarlo solo para quien conecte TikTok, que ya anda.

El pedido dice "siempre que técnicamente sea posible" — esta es la respuesta a eso. **Recomiendo (b) + (c) y cerrar esta tarea.**

**Hecho:** ⬜

---

# 🔵 Urgente no importante

> Se ve, lo piden, se resuelve rápido — pero no cambia el negocio. Ideal para meter entre tareas grandes o para alguien que recién entra al proyecto.

### T-35 · Login desktop: jerarquía y formato mobile — `S`

**Hoy:** desktop tenía cards grandes Creador/Marca, tabs de sesión arriba, “Volver a la landing”, y el aside se movía al cambiar el form.

**Hacer:** mantener layout desktop (aside + form). Orden: Creador/Marca (chips) → Iniciar sesión/Crear cuenta (pill). Solo logo. Aside fijo al cambiar rol.

**Archivos:** `src/app/auth.css`, `src/components/AuthEntry.tsx`, `src/components/AuthFrame.tsx`.

**Hecho:** ✅ 2026-09-12 — Camila Sylvester — `0b94740`. Jerarquía chips vs pill; logo-only; aside sticky / align start.

---

### T-34 · Login mobile: formato y marca — `S`

**Hoy:** en mobile el login se veía genérico / apretado; el botón “Volver a la landing” competía con el logo; el orden de Creador/Marca vs Iniciar sesión/Crear cuenta no era el pedido.

**Hacer:** solo mobile (≤640px): logo Connecta grande que vuelve al inicio, ocultar “Volver a la landing”, primero Creador/Marca y después Iniciar sesión/Crear cuenta, más aire entre bloques. Estética de marca (fondo landing, Inter, morado). Desktop sin cambios.

**Archivos:** `src/app/auth.css`, `src/components/AuthEntry.tsx`, `src/components/AuthFrame.tsx`, `src/components/Logo.tsx`.

**Hecho:** ✅ 2026-09-12 — Camila Sylvester — `570a7fc`. Formato mobile con estética de marca; desktop intacto.

---

### T-11 · Rediseñar el footer — `S`

**Hoy:** `SiteFooter.tsx` ya tiene los cinco links legales, en dos variantes (landing y feed).

**Falta:** Instagram de Connecta, LinkedIn de Connecta y mail de contacto. Más el rediseño visual, más limpio.

**Necesito de ustedes:** las URLs reales de Instagram y LinkedIn, y el mail de contacto.

**Hecho:** ⬜

---

### T-17 · Logos de las redes sociales — `S`

**Hacer:** poner los logos oficiales al lado de cada red. Que sean SVG y que estén en `public/` como el resto de los logos.

**Hecho:** ⬜

---

### T-32 · Cards de creadores: nombre y @ bien escritos — `S`

**Hacer:** nombre y apellido como dato principal, @usuario abajo como secundario, y las iniciales en mayúscula (`Martina Cuenya`, no `martina cuenya`).

**Ojo:** capitalizar automáticamente rompe apellidos como `de la Fuente` o `McCarthy`. Mejor normalizar al guardar y permitir corregirlo a mano, en vez de forzar mayúsculas al mostrar.

**Hecho:** ⬜

---

### T-06 · Usuarios en cards en la vista de admin — `M`

**Hoy:** `src/app/admin/usuarios/page.tsx:137` usa `<table className="creator-table">`.

**Hacer:** pasarlo a cards, con acceso rápido al perfil de cada uno.

**Por qué no es importante:** lo usan solo los admins, que son cinco, y la tabla actual funciona. Se ve mejor, no habilita nada nuevo.

**Ojo:** una tabla es más fácil de escanear y ordenar que las cards cuando hay muchas filas. Si la idea es encontrar gente más rápido, quizás lo que hace falta son mejores filtros sobre la tabla y no cards. Vale confirmarlo antes de hacerlo.

**Hecho:** ⬜

---

# ⚪ Ni importante ni urgente

> No porque sean malas ideas, sino porque **hoy no se pueden hacer bien**: dependen de otras tareas o de tener más datos de los que hay. Revisar de nuevo en 2 o 3 meses.

### T-22 · Mostrar la agencia que representa al creador — `XS`

Es mostrar el dato de T-16. Sale en minutos una vez que el campo exista. **Depende de T-16.**

**Hecho:** ⬜

---

### T-25 · Buscador de marcas para creadores — `M`

**Depende de T-29.** No tiene sentido buscar marcas mientras las marcas no tengan perfil que mostrar. Una vez hecho T-29, se copia el patrón de `creator-search.ts`, que ya existe.

**Hecho:** ⬜

---

### T-24 · Perfiles similares — `L`

**Por qué esperar:** una recomendación basada en categorías, audiencia y ubicación necesita volumen. Con pocos creadores cargados, "perfiles similares" muestra a los mismos tres siempre y queda peor que no mostrar nada.

**Cuando se haga:** empezar por lo simple (misma categoría + misma ubicación) antes de pensar en algo más elaborado.

**Hecho:** ⬜

---

### T-31 · Creadores recomendados para marcas — `L`

**Por qué esperar:** se recomienda a partir de con quién ya trabajó o a quién aceptó la marca. Eso es **historial que todavía no existe**: hace falta que haya pasado una cantidad de eventos y aceptaciones para que la recomendación no sea ruido.

**Mientras tanto:** que sea manual o por reglas simples (misma categoría que los que ya aceptó) rinde más que un algoritmo sin datos.

**Hecho:** ⬜

---

## Preguntas abiertas

Estas no las puedo decidir yo. Cuanto antes me las contesten, mejor:

1. **T-02** — ¿El cierre de sesión a los 30 minutos se puso por seguridad? ¿Cuánto quieren que dure?
2. **T-08** — El brief automático, ¿plantilla o IA? Son dos proyectos distintos.
3. **T-11** — URLs de Instagram y LinkedIn de Connecta, y mail de contacto.
4. **T-14** — Provincia y ciudad, ¿dos campos o uno?
5. **T-18** — ¿Aceptan cerrar el tema de la foto de Instagram con carga manual + TikTok? (ver la tarea)
6. **T-04** — El mail, ¿al crear la cuenta, al aprobarla, o los dos?
7. **T-21** — Marcas con las que trabajó, ¿texto libre o vinculado a marcas de Connecta?

---

## Por dónde arrancaría yo

**Semana 1:** todo el cuadrante rojo (4-5 días) + el bloque azul (2-3 días). Son 10 tareas terminadas en una semana, y las que más se notan.

**Semanas 2-3:** el Bloque A completo, en una sola migración. El perfil del creador queda cerrado.

**Semanas 4-6:** T-29 (perfil de marca). Es lo más grande, y destraba T-25, T-30 y parte de T-33.

**Después:** revisar de nuevo el cuadrante blanco con datos reales en la mano.
