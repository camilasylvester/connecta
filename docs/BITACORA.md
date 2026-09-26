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

<!-- Las entradas nuevas van ACÁ ARRIBA, la más reciente primera. -->

---

## 2026-09-26 — Resumen del día — Amadeo Rodríguez

> Hoy metí bastante, así que dejo este resumen arriba para que no haya que leer las siete entradas para saber qué cambió. Todo está en la rama `fix/alta-perfil-completo`, commit por commit, y cada cosa tiene su entrada abajo.

1. **Lint en cero** (`ef702bc`).
2. **Alta con la ficha completa antes de crear la cuenta** (`05ad37f`, T-36): se terminaron las solicitudes vacías.
3. **Ubicación en escalera País → Provincia → Municipio** para creadores, con Argentina, Uruguay, Chile y España (`5e31226`, T-14), y el **filtro de marcas** con la misma lógica.
4. **Foto de perfil obligatoria para postularse** (`36ba24c`, T-37).
5. **Celulares de Uruguay, Chile y España** (`ff7bc1c`, T-38).
6. **Ubicación en escalera también para las marcas** (`a84a509`).

**Nada de esto tocó la base:** no hay migraciones para correr en Neon.

**Lo que no pude probar de punta a punta** porque necesita sesión real: crear una cuenta de verdad (email y Google), el buscador logueado como marca, la subida real de la foto y una postulación real. Antes de mergear conviene hacer esa pasada con cuentas de prueba.

**Una cosa que noté y no es mía:** los ajustes visuales que subió Camila el 20/09 después del wizard (`513467c` a `57ee4bc`: la card de acceso estilo Marz y los arreglos de Clerk 7) no tienen entrada en la bitácora. Estaría bueno sumarla.

---

## 2026-09-26 — `a84a509` — Amadeo Rodríguez

**Qué cambié:** las marcas ahora cargan su ubicación con **la misma escalera País → Provincia → Municipio** que los creadores. Saqué la provincia suelta (tenía 5 opciones) y el campo libre "Ciudad / barrio". Lo cambié en el alta de la marca (paso "Tu marca"), en la edición de su perfil (`/dashboard/config`) y en la ficha que edita el admin. El prefijo del celular de la marca también sale de su país.

**Cómo lo guardo:** igual que en creadores, en `creator_meta.geo`. Es un jsonb que ya existía, así que **no hice migración**. Ya sé que el nombre de la columna no le queda bien a una marca, pero preferí eso antes que tocar la base; si molesta, más adelante se hace una columna propia. Además copio `province` = provincia, `city` = municipio y `company_location` = "Tigre, Buenos Aires", porque otras pantallas (como la ficha del admin) leen esos campos. Toda esa lógica quedó en un solo helper, `withGeo` (`src/lib/onboarding.ts`), y lo usan todos los formularios.

**Por qué:** me lo pidieron: que la ubicación de las marcas siga la misma lógica que la de los creadores.

**Dónde:** `RegistroMarcaForm` y `OnboardingForm` (ahora la escalera es para los dos roles). En `CreatorSocialProfile` pasé a usar `withGeo`. En `src/lib/onboarding.ts` están `withGeo` y la validación de ubicación completa, que ahora vale también para marcas; ahí borré `PROVINCES`, que quedó sin uso. En `creator-registro-v3.ts`, `brandMetaWithGeo`. El guardado está en `signup-draft.ts`, `after-auth/actions.ts` y `actions.ts`.

**Cómo probarlo:** `/login` → Crear cuenta → Marca → paso "Tu marca". Elegí país, provincia y municipio: sin municipio no te deja avanzar, y en la revisión tiene que decir "Tigre, Buenos Aires, Argentina". Con una marca que ya existe, entrá a `/dashboard/config`: la ubicación aparece como escalera; cambiala y guardá.

**Riesgo / qué mirar:** medio-bajo. Las marcas que ya existen tienen la ubicación como texto libre y eso no se puede traducir solo, así que la próxima vez que editen su perfil van a tener que elegirla en la escalera. Hasta entonces, lo que muestran no cambia. A los creadores no les cambia nada.

**Cómo lo verifiqué:** lint, `tsc` y `next build` limpios. Probé la ida y vuelta completa de una marca: la validación frena sin ubicación y sin municipio, y una vez guardada se reabre en edición con la escalera cargada. En local hice el paso 1 del alta con Argentina › Buenos Aires › Tigre.

---

## 2026-09-26 — `ff7bc1c` — Amadeo Rodríguez

**Qué cambié:** el celular ahora acepta **Argentina, Uruguay, Chile y España** (T-38), los mismos países de la ubicación. En todos los formularios que piden celular (alta de creador y de marca, `/completar-telefono`, `/mi-perfil` y la edición del admin) agregué un selector de prefijo al lado del número. En el alta del creador subí la ubicación arriba del celular, así el prefijo ya viene con el país elegido.

**Reglas por país:**
- **Argentina:** igual que antes (10 dígitos, y WhatsApp con 549).
- **Uruguay:** 9X XXX XXX; lo acepto también con el 0 adelante.
- **Chile:** 9 XXXX XXXX.
- **España:** 6XX o 7XX XX XX XX.

Acepto solo celulares, no fijos, porque el número es para WhatsApp. El link `wa.me` sale con el código de cada país.

**Compatibilidad:** todo número guardado sin "+" se sigue leyendo como argentino, así que los que ya estaban cargados no cambian.

**Por qué:** cuando hice la ubicación en escalera me di cuenta de que un creador de Uruguay, Chile o España podía cargar dónde vive pero no podía terminar el registro, porque su celular no validaba. Lo hablé con el jefe y me dijo que los aceptemos.

**Dónde:** reescribí `src/lib/phone.ts` (`parseMobile`, `mobileValidationError`, `isValidMobile`, `formatMobileDisplay`); renombré las funciones `…ArMobile…` porque ya no son solo argentinas. El campo nuevo es `src/components/PhoneInput.tsx` + `phone-input.css`, y está en los formularios `RegistroCreadorV3Form`, `RegistroMarcaForm`, `CompletarTelefonoForm`, `CreatorSocialProfile` y `OnboardingForm`. En el servidor (`auth.ts`, `account-gate.ts`, `onboarding.ts`, `actions.ts`, `after-auth/actions.ts`, `signup-draft.ts`) solo cambió el nombre de las funciones.

**Cómo probarlo:** alta de creador → paso 1 → elegí Uruguay en la ubicación y fijate que el prefijo pasa solo a +598. Un fijo (2 123 4567) tiene que dar error y un celular (094 123 456) tiene que pasar; en la revisión se ve "+598 94 123 456". Probá también un número argentino viejo en `/mi-perfil`: se tiene que seguir mostrando y guardando igual.

**Riesgo / qué mirar:** medio-bajo. Toca la validación del celular, que es obligatorio en todo el alta. Argentina quedó idéntica: lo comparé contra la versión anterior. No toqué la base.

**Dos formatos argentinos que no acepta** (ya no los aceptaba antes, no lo cambié): "11 15 2345-6789", con el 15 en el medio, y las áreas de 3 dígitos como el 351 de Córdoba, que se muestran "35 1123-4567". Queda anotado para otro momento.

**Cómo lo verifiqué:** lint, `tsc` y `next build` limpios, y 14 casos del validador (los 4 países, fijos y países de afuera). En local hice el alta de una creadora de Uruguay hasta la revisión, y el wizard de marca con un celular de España.

---

## 2026-09-26 — `36ba24c` — Amadeo Rodríguez

**Qué cambié:** ahora la **foto de perfil es obligatoria para postularse** (solo creadores). Crear la cuenta sigue sin pedirla. Recién cuando alguien quiere postularse a un evento y no tiene foto, en `/aplicar` le aparece "Subí tu foto de perfil" en lugar del botón de enviar. La sube ahí mismo (se recorta cuadrada, va a Vercel Blob y queda guardada en su perfil) y sigue con la postulación.

**Por qué:** me lo pidieron. Las marcas eligen mirando la ficha, y una ficha con iniciales no la elige nadie.

**Dónde:** en `src/app/actions.ts`, `applyToEvent` ahora rechaza la postulación si no hay foto. Sumé la acción `setMyAvatar`, que solo acepta URLs de Vercel Blob, para que nadie pueda "cumplir" pegando cualquier link. El paso "Subí tu foto" está en `src/components/ApplyForm.tsx`. El recorte de la foto, que antes vivía adentro de `CreatorSocialProfile`, lo pasé a `src/lib/avatar-crop.ts` para compartirlo.

**Cómo probarlo:** con un creador sin foto, abrí el link de un evento (`/aplicar/...`). Tiene que pedirte la foto y no mostrar "Enviar postulación". Subí una: aparece el formulario normal y la foto queda en `/mi-perfil`. Con un creador que ya tiene foto no cambia nada.

**Riesgo / qué mirar:** medio-bajo. Los creadores que hoy no tienen foto no se van a poder postular hasta subirla, que es justamente lo pedido. El chequeo está en el servidor, así que frena también cualquier otro camino de postulación. No toqué la base.

**Cómo lo verifiqué:** lint, `tsc` y `next build` limpios. Vi el paso de la foto en local con el `ApplyForm` real y un creador sin foto. **No** probé la subida real a Blob ni una postulación real, porque requieren sesión.

---

## 2026-09-26 — `5e31226` — Amadeo Rodríguez

**Qué cambié:** la ubicación de los creadores pasó a ser una **escalera País → Provincia → Municipio**, con Argentina, Uruguay, Chile y España completos (T-14). La puse en el alta, en la edición de `/mi-perfil` y en la ficha que edita el admin. El **filtro de Ubicación del buscador de marcas** sigue la misma lógica.

- **Datos:**

  | País | Primer nivel | Segundo nivel |
  |---|---|---|
  | Argentina | 24 provincias | 2.289 municipios (en CABA, los 48 barrios) |
  | Uruguay | 19 departamentos | 217 (municipios, capitales y barrios de Montevideo) |
  | Chile | 16 regiones | 346 comunas |
  | España | 52 provincias | 8.131 municipios |

  Están en `public/geo/*.json` y el navegador los baja recién cuando alguien elige ese país. Se regeneran con `node scripts/build-geo.mjs`; ahí dejé explicadas las fuentes y los parches que tuve que hacer:
  - Georef no tiene municipios de Santa Cruz ni de Santiago del Estero, así que para esas dos provincias usé las localidades.
  - En Uruguay las capitales departamentales no son municipio, así que las agregué a mano.
- **Buscador:** cada nivel tiene un buscador que ignora las tildes ("cordoba" encuentra "Córdoba").
- **Filtro de marcas:** tildás países; adentro de cada país sumás provincias, y adentro de cada provincia, municipios. **Manda lo más específico:** Argentina + Córdoba busca solo en Córdoba. Entre elecciones del mismo nivel es "o" (Córdoba o Madrid).
- **Perfiles viejos:** "Palermo", "Rosario", "La Plata", la provincia "CABA"… se traducen solos a la escalera (por ejemplo, Rosario → Argentina › Santa Fe › Rosario). Así aparecen en los filtros sin migrar nada, y cuando editen su perfil la escalera ya arranca cargada.

**Por qué:** me lo pidieron: que la gente cargue bien dónde vive y que las marcas puedan buscar exactamente la zona que quieren. La lista vieja tenía 6 valores mezclados: una provincia, una ciudad y un barrio en la misma lista.

**Dónde:**
- **Nuevos:** `src/lib/geo.ts` (los países, la carga y la regla del filtro), `src/components/GeoPicker.tsx` + `geo-picker.css`, `scripts/build-geo.mjs` y `public/geo/`.
- **Formularios y buscador:** `RegistroCreadorV3Form`, `CreatorSocialProfile`, `OnboardingForm`, `CreatorExplorer` + `explorer.css`, `creator-search.ts`, `creator-registro-v3.ts` y `onboarding.ts`.
- **Guardado:** `after-auth/actions.ts` y `actions.ts` guardan `province` = provincia y `city` = municipio. En `schema.ts` solo cambié el tipo del jsonb.
- **Middleware:** en `middleware.ts` hice público `/geo/*`. Sin eso el alta no podía bajar las listas; lo encontré probando.

**Base de datos:** **sin migración.** La escalera se guarda en `creator_meta.geo`, un jsonb que ya existía, y la copio a las columnas `province` y `city`.

**Cómo probarlo:**
- Alta de creador → paso 1: elegí país, provincia y municipio. Sin municipio no avanza.
- `/mi-perfil` → Editar: cambiá la ubicación y guardá.
- Como marca, `/dashboard/explorar` → Ubicación → Argentina → sumá Córdoba → sumá Río Cuarto. La lista se tiene que achicar en cada paso.

**Riesgo / qué mirar:** medio. Hay una validación nueva: un creador sin ubicación completa no puede guardar su perfil hasta completarla. Los viejos que tenían "Córdoba" solo tienen que elegir el municipio.

**Cómo lo verifiqué:** lint, `tsc` y `next build` limpios, y 11 casos de la regla del filtro. En local probé:
- El filtro, con creadores de ejemplo en los 4 países.
- El paso 1 del alta con España › Madrid › Alcobendas, hasta la revisión.

La ficha que sale de ahí pasa la validación del servidor y guarda `province`, `city` y `geo`.

---

## 2026-09-26 — `05ad37f` — Amadeo Rodríguez

**Qué cambié:** el alta volvió a ser **perfil primero, cuenta después** (T-36). Lo hablé con el jefe y me dijo: *"que los perfiles lleguen completos: que se pidan los datos de a etapas y una vez hecho se cree la cuenta"*. El orden al crear cuenta ahora es: Crear cuenta → Creador/Marca → **ficha completa por etapas** → Google/email. La cuenta recién existe cuando la ficha está terminada.

- **Creador:** el wizard de 5 etapas que ya teníamos (Datos básicos → Redes → Sobre vos → Categorías → Revisión). El último botón ahora dice "Continuar a crear la cuenta".
- **Marca:** le armé un wizard nuevo de 4 etapas (Tu marca → Contacto → Objetivos → Revisión), con el mismo estilo que el del creador. Reemplaza el formulario largo de una sola página, también en `/completar-perfil`.

**Cómo llegan los datos a la cuenta:** la ficha entera queda guardada como borrador en el navegador (`localStorage`), y `/completar-perfil` la sube con `syncOnboarding` apenas se crea la cuenta. En ese mismo paso queda marcado `onboardingCompleted`. Además, el contacto (nombre, celular, Instagram/marca y términos) viaja con la cuenta como `unsafeMetadata` de Clerk, y `ensureProfile()` lo escribe al crear la fila: es la red de seguridad. No mando la ficha entera a Clerk porque la metadata tiene un tope de ~8 KB, y un creador con muchas categorías se acerca a ese número.

**El candado del admin vuelve a pedir la ficha completa** (`onboardingCompleted`). La "ficha mínima" que había armado el 23/09 (el paso "Tus datos" y aceptar solicitudes con nombre, celular e IG) la descarté y no llegó a subirse: con este orden ya no hace falta.

**Por qué:** al dueño le llegaban solicitudes casi vacías que no podía aceptar. Desde `a1fc48b` (20/09) la cuenta se creaba antes que el perfil, y cada vez que alguien abandonaba a la mitad quedaba una fila `pending` vacía.

**Dónde:** nuevos `src/lib/signup-draft.ts` (borrador de la marca y metadata del alta) y `src/components/RegistroMarcaForm.tsx`. Además toqué `src/components/AuthEntry.tsx` (el paso de la ficha antes del acceso), `src/components/RegistroCreadorV3Form.tsx` (modo alta, con `onComplete`/`onCancel`), `src/components/CompletarPerfilForm.tsx` (sube también el borrador de la marca y usa el wizard nuevo) y `src/lib/auth.ts` (`ensureProfile` guarda el celular y la persona de contacto desde la metadata).

**Cómo probarlo:**
1. `/login` → Crear cuenta → Marca: tienen que aparecer las 4 etapas, y **no** Google/email hasta terminar la revisión y aceptar los términos.
2. Creá la cuenta con email y con Google: tiene que caer en "Guardando tu ficha" y después en `/pendiente`.
3. En `/admin/solicitudes` la ficha tiene que estar completa y ser aceptable.
4. Repetí lo mismo con Creador (5 etapas).
5. Probá "Atrás" desde el acceso: vuelve a la ficha con todo cargado.

**Riesgo / qué mirar:** medio, porque toca el alta en producción. Si el borrador del navegador se pierde entre la ficha y la cuenta (por ejemplo, alguien abre el mail de verificación en otro navegador), la cuenta nace con el contacto pero sin la ficha. Esa persona **no** aparece como aceptable, y al entrar cae en `/completar-perfil` para terminarla. No toqué la base. Las fichas vacías que ya entraron siguen ahí: hay que limpiarlas a mano.

**Cómo lo verifiqué:** lint, `tsc` y `next build` limpios. En local recorrí las etapas de marca y de creador hasta la pantalla de crear cuenta, validaciones incluidas. **No** creé una cuenta real de punta a punta: falta probar el salto cuenta → `/completar-perfil` → `/pendiente` contra un Clerk y una base de prueba.

---

## 2026-09-26 — `ef702bc` — Amadeo Rodríguez

**Qué cambié:** dejé `npm run lint` en cero. Venía fallando con 12 errores y 1 warning: nueve eran viejos (de agosto) y tres los trajo el lote del 12 al 20/09. Casi todos eran `setState` sincrónico adentro de un `useEffect`, que dispara renders en cascada; los pasé al patrón que recomienda React (ajustar el estado durante el render cuando depende de props). En el alta del creador, el tilde de términos guardado se lee con `useSyncExternalStore`, para no romper la hidratación del checkbox.

**Por qué:** con el lint roto no se ven los errores nuevos. Lo trabajé el 23/09 y lo subí aparte del cambio del alta, para respetar lo de una idea por commit. Esta entrada va en un commit posterior porque separé el lint después.

**Dónde:** `scripts/check-env.mjs`, `src/app/admin/eventos/page.tsx`, `src/app/sso-callback/page.tsx`, `AuthEntry`, `CompletarPerfilForm`, `CreatorSocialProfile`, `EmailPasswordSignIn` y `RegistroCreadorV3Form`.

**Cómo probarlo:** `npm run lint` → 0 errores, 0 warnings.

**Riesgo / qué mirar:** bajo. No busqué cambiar ningún comportamiento; solo revisar que el login, el alta y admin/eventos se vean igual que antes.

---

## 2026-09-20 — `a1fc48b` — Camila Sylvester

**Qué cambié:** rediseñé el flujo de **Iniciar sesión** y **Crear cuenta** al estilo wizard (primero elegís la acción, después Creador/Marca, después Google/email). El login ya no pide Instagram. El perfil del creador (5 pasos) arranca después del acceso, con barra de progreso y términos al final. Si entrás por el tipo de cuenta equivocado, te lo aclara y te pide el camino correcto.

**Por qué:** pediste que creación e inicio de sesión sean intuitivos como las referencias (selección primero, datos después), con estética Connecta.

**Dónde:** `AuthEntry`, `AuthFrame`, `AuthWizardBits`, `LoginClerkSignIn`, `RegistroClerkSignUp`, `RegistroCreadorV3Form`, `after-auth/go`, gates de teléfono/términos/perfil, `auth.css`, landing.

**Cómo probarlo:** `/login` → Iniciar sesión o Crear cuenta → Creador/Marca → Google/email. Crear cuenta creador debe mandarte al wizard de perfil. Probar también rol incorrecto (cuenta marca entrando como creador).

**Riesgo / qué mirar:** medio. Cambió toda la puerta de auth; links viejos con `?role=` siguen andando. Revisar mobile y desktop.

---

## 2026-09-20 — `fd7d563` — Camila Sylvester

**Qué cambié:** arreglé “Continuar con Google” en iniciar sesión y crear cuenta. Al volver de Google, Clerk dejaba la URL en `/login#/sso-callback` (o `/registro/creador#/sso-callback`), pero la pantalla ya no tenía el formulario de Clerk montado y el login no terminaba. Ahora un handler global completa ese callback y manda a `/after-auth`. También alineé los redirects de sign-up/sign-in para que no manden a `/` por error.

**Por qué:** reportaron que no se podía iniciar sesión ni crear cuenta con Google.

**Dónde:** `src/components/ClerkSsoHashHandler.tsx`, `src/app/layout.tsx`, `src/components/LoginClerkSignIn.tsx`, `src/components/RegistroClerkSignUp.tsx`, `src/app/sso-callback/page.tsx`.

**Cómo probarlo:** `/login` → Continuar con email → Continuar con Google (cuenta de prueba). Debe volver a Connecta y pasar por after-auth (perfil / teléfono / términos según corresponda). Igual desde crear cuenta marca o paso final de registro creador.

**Riesgo / qué mirar:** medio-bajo. Solo el retorno OAuth; email/contraseña no cambia. Si Google falla, mirar que aparezca “Conectando tu cuenta…” un momento y no quede en el form de Instagram.

---

## 2026-09-20 — `2db0284` — Camila Sylvester

**Qué cambié:** el botón “Continuar/Guardando…” en `/completar-telefono` y `/aceptar-terminos` ya no se queda trabado después de guardar. El dato sí se guardaba, pero la navegación soft (`router.replace` + `router.refresh` dentro de `useTransition`) no terminaba; ahora se hace navegación completa a `/after-auth/go`.

**Por qué:** reportaron que al cargar celular o aceptar términos el botón quedaba en Guardando… y solo al recargar se veía el cambio.

**Dónde:** `src/components/CompletarTelefonoForm.tsx`, `src/components/AceptarTerminosForm.tsx`.

**Cómo probarlo:** entrar con una cuenta sin teléfono → cargar un celular válido → Continuar debe salir de la pantalla (no quedarse en Guardando…). Igual con aceptar términos.

**Riesgo / qué mirar:** bajo. Solo esos dos formularios de gate.

---

## 2026-09-14 — `6ea47ab` — Camila Sylvester

**Qué cambié:** rediseñé el login **desktop** al formato tipo “Bienvenido a Connecta”: logo Connecta grande a la izquierda, a la derecha el título + “Iniciá sesión” / “Creá tu cuenta”, sin el label “Sos…”. Se mantiene Creador/Marca y el toggle de sesión. El mismo layout (logo izquierdo) aplica a los pasos siguientes que usan `AuthFrame`. Mobile no cambia el formato acordado.

**Por qué:** pedido de producto para acercar el login desktop al mock de referencia, sin el tono infantil de “Sos…”.

**Dónde:** `src/components/AuthFrame.tsx`, `src/components/AuthEntry.tsx`, `src/app/auth.css`.

**Cómo probarlo:** `/login` en desktop (≥641px): logo grande a la izquierda, “Bienvenido a Connecta” + subtítulo a la derecha, chips Creador/Marca sin “Sos…”, tabs Iniciar sesión/Crear cuenta. Probar también contraseña / signup marca. En mobile (≤640) el login sigue con logo arriba.

**Riesgo / qué mirar:** bajo-medio. Revisar pantallas AuthFrame (completar teléfono, términos, crear contraseña) en desktop.

---

## 2026-09-14 — `ec9ae6d` — Camila Sylvester

**Qué cambié:** el checkbox de Términos y Privacidad también aparece al crear cuenta como **creador** (antes solo se veía en marca en la primera pantalla). Sigue siendo obligatorio para continuar al registro.

**Por qué:** pediste paridad: el creador tiene que ver y aceptar los términos igual que la marca.

**Dónde:** `src/components/AuthEntry.tsx`, `src/components/RegistroCreadorV3Form.tsx`.

**Cómo probarlo:** `/login` → Crear cuenta → Creador: debajo de Instagram tiene que estar el checkbox; sin marcarlo no avanza. Marca sigue igual.

**Riesgo / qué mirar:** bajo. En el paso Revisión del registro creador el checkbox sigue (si ya lo marcó en login, viene tildado).

---

## 2026-09-14 — `0b1feec` — Camila Sylvester

**Qué cambié:** arreglé el login/registro en mobile: Creador/Marca vuelven a ser un toggle en píldora (lado a lado, no cuadrados dentro de un óvalo), los Términos ya no se van de la pantalla, y el footer/legal deja de desbordar el ancho.

**Por qué:** capturas en celular mostraban el checkbox de términos cortado, overflow horizontal y el selector de rol roto por CSS que pisaba el layout mobile.

**Dónde:** `src/app/auth.css`, `src/components/TermsAcceptCheckbox.tsx`.

**Cómo probarlo:** abrir `/login` en viewport ≤640px (Crear cuenta → Marca). Creador/Marca en una sola fila tipo pill; texto de términos completo y envuelto; footer sin salir del borde; Continuar visible con scroll.

**Riesgo / qué mirar:** bajo. Solo CSS/auth mobile; desktop no debería cambiar el look de los chips.

---

## 2026-09-12 — `f28012a` — Camila Sylvester

**Qué cambié:** en el registro (creador y marca) hay que aceptar Términos + Privacidad con un solo checkbox (tarea **T-05**). Guardamos en la base `terms_accepted_at` y `terms_version` (`v1`). Quien ya tenía cuenta y nunca aceptó queda bloqueado en `/aceptar-terminos` hasta hacerlo. En admin se ve si aceptó y con qué versión.

**Por qué:** obligación legal — se procesaban datos personales sin consentimiento registrado.

**Dónde:** `drizzle/0009_terms_accepted.sql`, `src/db/schema.ts`, `src/lib/terms.ts`, `src/lib/auth.ts`, `src/lib/account-gate.ts`, `src/components/TermsAcceptCheckbox.tsx`, `src/components/AceptarTerminosForm.tsx`, `src/app/aceptar-terminos/`, registro creador/marca, completar perfil marca, admin usuario.

**Cómo probarlo:** (1) Correr en Neon el SQL de `drizzle/0009_terms_accepted.sql`. (2) Registro marca/creador: sin checkbox no avanza; con checkbox se crea la cuenta y el perfil tiene fecha/versión. (3) Usuario viejo sin términos → `/aceptar-terminos`. (4) Admin → ficha usuario muestra la aceptación.

**Riesgo / qué mirar:** migración `0009` ya corrida en Neon. Cuentas existentes quedan bloqueadas hasta aceptar (intencional).

---

## 2026-09-12 — `0664b40` — Camila Sylvester

**Qué cambié:** el celular pasó a ser **bloqueo al entrar** (tarea **T-13**, decisión b): si un creador o marca ya tiene la ficha pero no tiene celular argentino válido, lo mandamos a `/completar-telefono` y no puede usar la app hasta cargarlo. También quedó obligatorio al editar el perfil. Esto **reemplaza** la versión anterior donde las cuentas viejas podían seguir sin teléfono.

**Por qué:** pediste campos obligatorios a completar al entrar (no opcionales para quien ya estaba adentro).

**Dónde:** `src/lib/account-gate.ts`, `src/lib/roles.ts`, `src/app/completar-telefono/`, `src/components/CompletarTelefonoForm.tsx`, `src/app/after-auth/actions.ts` (`syncPhone`), gates en eventos / postulaciones / aplicar / pendiente / after-auth, formularios de edición. Notas en `docs/TAREAS.md` (T-13).

**Cómo probarlo:** entrar con una cuenta sin `phone` (o borrarlo en admin): tiene que ir a `/completar-telefono` y no a eventos/dashboard. Después de guardar un número válido, sigue el flujo normal. Editar perfil sin teléfono no deja guardar.

**Riesgo / qué mirar:** medio. Todas las cuentas existentes sin teléfono quedan bloqueadas hasta completar; es el comportamiento pedido.

---

## 2026-09-12 — `86696df` — Camila Sylvester

**Qué cambié:** teléfono celular argentino obligatorio en registro/onboarding (creadores y marcas); reordené el onboarding del creador (Datos básicos → Redes → Sobre vos → Categorías → Revisión); en el perfil del creador hay link directo a WhatsApp (`wa.me`) cuando hay número válido (tareas **T-12** + **T-13**). *Nota: en ese momento las cuentas viejas podían omitir el teléfono; eso se cambió el mismo día en `0664b40` (bloqueo al entrar).*

**Por qué:** hace falta el celular para contactar, y conviene pedir el teléfono junto con el reorder del formulario.

**Dónde:** `src/lib/phone.ts`, `src/lib/onboarding.ts`, `src/lib/creator-registro-v3.ts`, `src/components/RegistroCreadorV3Form.tsx`, `src/components/OnboardingForm.tsx`, `src/components/CreatorSocialProfile.tsx`, `src/components/ProfileEditClient.tsx`, `src/components/CompletarPerfilForm.tsx`, `src/app/after-auth/actions.ts`, `src/app/actions.ts`, `src/app/dashboard/creadores/[id]/page.tsx`.

**Cómo probarlo:** (1) registro creador: paso 1 pide celular AR válido y el orden de pasos es el nuevo; (2) onboarding marca: mismo campo obligatorio; (3) con teléfono cargado, en perfil social y en `/dashboard/creadores/[id]` aparece “WhatsApp” y abre `wa.me`.

**Riesgo / qué mirar:** bajo en el momento del commit. Ver entrada `0664b40` para el bloqueo posterior.

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
