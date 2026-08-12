# Auditoría de código — CONNECTA

**Documento de auditoría (Fases 1–3)**  
**Proyecto:** CONNECTA — plataforma marcas ↔ creadores  
**Fecha Fase 1:** 9 de agosto de 2026  
**Fecha Fase 2 (limpieza C1–C11):** 9 de agosto de 2026  
**Alcance Fase 1:** solo lectura.  
**Alcance Fase 2:** limpieza aprobada C1–C11 (sin cambios de lógica de negocio ni auth/contraseñas).  
**Fase 3:** sugerencias listadas al final — **no implementadas**.  
**Stack:** Next.js 16 · Clerk · Neon Postgres · Drizzle ORM.  
**Producción:** https://www.connectainf.com


---

## Portada / control del documento

| Campo | Valor |
|-------|--------|
| Nombre | Auditoría de código CONNECTA — Fase 1 |
| Versión | 1.1 (Fase 2 aplicada + Fase 3 sugerencias) |
| Estado | Fase 1 ✓ · Fase 2 ✓ (C1–C11) · Fase 3 = solo lista de sugerencias |
| Stack auditado | Next.js 16 · Clerk · Neon Postgres · Drizzle ORM |
| Producción | https://www.connectainf.com |
| Fuente del hallazgo | Revisión estática del repo local (sin cambios de código) |

**Cómo usar este documento**

1. Leer las secciones 1–2 para entender cómo está armada la app.  
2. Revisar la sección 3 (qué se puede limpiar) y marcar qué aprobás.  
3. Revisar la sección 4 (seguridad) — informativo; **no se aplica en Fase 2** sin OK aparte.  
4. Cuando apruebes la sección 3, se ejecuta la **Fase 2 (limpieza)**.  
5. Después se agrega la **Fase 3 (sugerencias)** a este mismo documento o a un anexo.

> Copia corta del mismo contenido: [`../REPORTE.md`](../REPORTE.md) en la raíz del repo.

---

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)  
2. [Mapa de arquitectura](#2-mapa-de-arquitectura)  
3. [Flujo de usuario (de punta a punta)](#3-flujo-de-usuario-de-punta-a-punta)  
4. [Código innecesario / muerto](#4-código-innecesario--muerto)  
5. [Alertas de seguridad](#5-alertas-de-seguridad)  
6. [Lista “revisar manualmente”](#6-lista-revisar-manualmente)  
7. [Estado de fases y registro de limpieza](#7-estado-de-fases-y-registro-de-limpieza)  
8. [Anexo — árbol de carpetas](#8-anexo--árbol-de-carpetas)  
9. [Sugerencias de mejora (Fase 3)](#9-sugerencias-de-mejora-fase-3--solo-lista)

---

## 1. Resumen ejecutivo

CONNECTA es una app web que conecta **marcas** con **creadores**. El usuario se registra con email/contraseña (y opcionalmente Google), completa un formulario de perfil, espera aprobación de un admin y después usa feed de eventos (creador) o panel de marca/admin.

| Pieza | Quién la hace |
|-------|----------------|
| Login / contraseñas | **Clerk** (ellos guardan y hashean; CONNECTA no guarda passwords) |
| Perfiles, eventos, postulaciones | **Neon** (Postgres) vía **Drizzle** |
| Instagram / TikTok hoy | Solo **usuario (@)** + datos manuales + links / miniaturas públicas. **No hay OAuth ni tokens** |
| Diseño de referencia | Carpeta `mockups/` (HTML estático; no corre en la app) |
| Base vieja | Carpeta `supabase/` = legado; **producción usa Neon** |

**Hallazgos clave de Fase 1**

- Hay código muerto claro (sign-up custom viejo, componentes sin import, helpers sin uso, SVGs default de Next).  
- Hay 5 alertas de seguridad a tener en cuenta (admins hardcodeados, hint de login, imágenes en base64, etc.).  
- Las contraseñas están bien manejadas vía Clerk.  
- No hay dependencias npm claramente sin uso.

---

## 2. Mapa de arquitectura

### 2.1 Vista rápida

| Área | Dónde vive | En simple |
|------|------------|-----------|
| Páginas / rutas | `src/app/` | Cada carpeta ≈ una URL |
| Componentes UI | `src/components/` | Piezas reutilizables |
| Acciones de negocio | `src/app/actions.ts` (+ actions locales) | Escriben en la base (servidor) |
| Auth y permisos | `src/lib/auth.ts`, `account-gate.ts`, `roles.ts`, `admin-emails.ts`, `middleware.ts` | Quién sos y a dónde podés ir |
| Onboarding | `src/lib/onboarding.ts`, `OnboardingForm`, `CompletarPerfilForm` | Formulario marca/creador |
| Instagram | `src/lib/instagram.ts` | Normaliza `@` y arma link público |
| TikTok (hoy) | campos DB + `src/lib/posts.ts` | Handle, seguidores manuales, oEmbed |
| Filtros | feed, solicitudes, admin | Cliente o servidor según pantalla |
| Base de datos | `src/db/`, `drizzle/*.sql` | Tablas en Neon |
| Mockups | `mockups/` | Solo referencia visual |

### 2.2 Base de datos (relaciones)

```
profiles (id = usuario de Clerk)
  ├── events (marca dueña del evento)
  │     └── applications (postulación de un creador)
  └── creator_posts (portfolio de links IG/TikTok/YouTube)

admin_allowlist  → existe en schema, la app NO la usa
                   (admins = lista en código / variable de entorno)
```

Migraciones vivas: `drizzle/0000_init.sql` … `0006_post_metrics.sql`.

### 2.3 Dependencias (`package.json`)

Todas las dependencias listadas tienen uso justificable (`@clerk/nextjs`, Neon, Drizzle, Next, React, Tailwind, ESLint, TypeScript, dotenv para Drizzle Kit). **Ninguna npm claramente muerta.**

---

## 3. Flujo de usuario (de punta a punta)

### 3.1 Pasos

1. **Landing (`/`)** → “Soy creador” / “Soy marca” → `/registro?role=…`
2. **Registro** → email + contraseña en **Clerk** (rol en metadata). La contraseña **no** se guarda en CONNECTA.
3. **After-auth** → se crea/actualiza el perfil en Neon. No-admins quedan `pending` y sin onboarding completo.
4. **Completar perfil** → formulario largo → se guarda y marca onboarding hecho.
5. **Pendiente / rechazado** → espera (o rechazo) de admin en `/admin/solicitudes`.
6. **Aprobado**  
   - Creador → `/eventos` (filtros por categoría), postularse, perfil.  
   - Marca → `/dashboard` (eventos en borrador hasta que admin publique).  
   - Admin → `/admin`.

### 3.2 Filtros

| Pantalla | Qué filtra | Dónde corre |
|----------|------------|-------------|
| Feed `/eventos` | Categoría | Navegador (server solo trae eventos activos) |
| Lista eventos marca | Activos / finalizados / borradores | Navegador |
| Solicitudes de un evento | Estado + búsqueda nombre/@ | Navegador |
| Admin usuarios | Texto + rol | Servidor (consulta a DB) |
| Admin postulaciones / eventos | Estado / pendientes | Servidor |

### 3.3 Instagram vs TikTok (hoy)

| | Instagram | TikTok |
|---|-----------|--------|
| Qué hay | `@`, link, seguidores manuales | Handle, seguidores manuales, posts + miniatura oEmbed |
| Login OAuth | No | No |
| Tokens en la app | Ninguno | Ninguno |

### 3.4 Diagrama de flujo

```mermaid
flowchart TD
  A[Landing] --> B[Registro: rol + Clerk]
  B --> C[after-auth: perfil en Neon]
  C --> D{¿Completó formulario?}
  D -->|No| E[completar-perfil]
  E --> F{¿Admin aprobó?}
  D -->|Sí| F
  F -->|pending| G[pendiente]
  F -->|rejected| H[rechazado]
  F -->|creador aprobado| I[/eventos]
  F -->|marca aprobada| J[/dashboard]
```

---

## 4. Código innecesario / muerto

**Leyenda**

- **Candidato claro (Fase 2):** se puede borrar/limpiar con bajo riesgo si lo aprobás.  
- **Revisar manualmente:** no borrar a ciegas.

### 4.1 Candidatos claros para Fase 2

| # | Ítem | Ruta | Línea(s) | Evidencia |
|---|------|------|----------|-----------|
| C1 | Sign-up custom reemplazado | `src/components/EmailPasswordSignUp.tsx` | archivo (export L12) | Ningún import; registro usa `RegistroClerkSignUp` |
| C2 | Nota IG OAuth abandonada | `src/components/InstagramAuthNote.tsx` | archivo (export L6) | Ningún import |
| C3 | Helper IG sin uso | `src/lib/instagram.ts` | `instagramUsername` L20–24 | Solo definición |
| C4 | Helper path sin uso | `src/lib/clerk-auth.ts` | `isSafeInternalPath` L70–72 | Solo definición |
| C5 | Gates sin callers | `src/lib/account-gate.ts` | `requireApprovedProfile` L25–30; `ensureApprovedProfile` L32–38 | Nadie los llama |
| C6 | Alias deprecated | `src/app/actions.ts` | `adminDeleteEvent` L516–518 | Nadie lo importa |
| C7 | Import sin usar | `src/lib/auth.ts` | L5 (`isAdminEmail`) | Solo se usa `isAdminEmailList` |
| C8 | Clave sessionStorage huérfana | `src/lib/onboarding.ts` | `ONBOARDING_STORAGE_KEY` L146 | Nunca hay `setItem` |
| C9 | Rama after-auth muerta | `src/app/after-auth/page.tsx` | L22–36 | No hay writers de esas keys |
| C10 | Rutas fantasma middleware | `src/middleware.ts` | L10–11 `/sign-in`, `/sign-up` | No existen esas páginas |
| C11 | SVGs default de Next | `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` | — | 0 referencias en `src` |

### 4.2 Logs

| Ítem | Ruta | Líneas | Nota |
|------|------|--------|------|
| Error post-auth | `src/app/after-auth/go/page.tsx` | L18 `console.error` | Útil; decidir si se deja |
| Stub welcome | `src/lib/welcome-email.ts` | L13, L24 `console.info` | Loguea email (ver S3) |

No hay `console.log` de debug masivos en `src/`.

### 4.3 Stubs de producto (no son “basura”)

| Ítem | Ruta |
|------|------|
| Email de bienvenida (no envía) | `src/lib/welcome-email.ts` |
| Página reseñas vacía | `src/app/dashboard/resenas/page.tsx` |
| Redirect stub solicitudes | `src/app/dashboard/eventos/[id]/solicitudes/page.tsx` |
| Copy viejo “Continuar al registro” | default de `OnboardingForm` (overrideado en completar-perfil) |

---

## 5. Alertas de seguridad

### 5.1 Prioridad alta / media

| ID | Hallazgo | Dónde | Por qué importa |
|----|----------|-------|-----------------|
| S1 | Emails de admin hardcodeados en el repo | `src/lib/admin-emails.ts` L2–8 | El código revela qué emails son admin. Preferible solo env/secretos. |
| S2 | Hint de login sin autenticación | `src/app/login/actions.ts` L12–32 | Se puede probar emails y ver si existen / pending / rejected. |
| S3 | Stub de email loguea PII | `src/lib/welcome-email.ts` L24–28 | Email en logs de servidor. |
| S4 | Imágenes como data-URL en la DB | compress + `image_urls` / avatars | Infla Neon; riesgo de abuso de storage. |
| S5 | Middleware solo chequea sesión | `src/middleware.ts` | La aprobación se chequea en páginas; una ruta nueva sin gate sería un riesgo. |

### 5.2 Lo que está bien

| Tema | Estado |
|------|--------|
| Contraseñas | Custodiadas y hasheadas por **Clerk**. Correcto. |
| Secrets en código | No se hallaron keys reales en el source; van en `.env` (gitignored). |
| Tokens IG/TikTok | No existen en frontend ni DB. |
| Auto-promoción a admin | Bloqueada; solo allowlist de email. |
| Tokens de invitación a eventos | `randomBytes(16)` hex — razonable. |
| Validación onboarding | Campos mínimos obligatorios (nombre, IG, provincia, email, rol + bloque marca/creador). |

### 5.3 Deuda (no crítico)

- Edad/teléfono poco validados.  
- Email de contacto del form puede diferir del de Clerk.  
- oEmbed TikTok: conviene allowlist de hosts.  
- `/aplicar/[token]` es público: el token es la protección.

---

## 6. Lista “revisar manualmente”

1. Carpeta `supabase/` y menciones a Supabase en docs/mockups.  
2. Carpeta `mockups/` (diseño).  
3. Tabla `admin_allowlist` vs lista en `admin-emails.ts`.  
4. Rama `sessionStorage` en after-auth (limpiar vs restaurar).  
5. Wrapper `AdminDeleteEventButton` (está en uso).  
6. Página `/dashboard/resenas` (producto futuro).  
7. `console.error` en after-auth/go.  
8. Logos en `public/logo-*` (en uso — no tocar).  
9. **Cualquier cambio de auth/contraseñas/Clerk** — fuera de Fase 2 salvo OK explícito.

---

## 7. Estado de fases y registro de limpieza

| Fase | Estado |
|------|--------|
| Fase 1 — Mapeo | Completada |
| Fase 2 — Limpieza C1–C11 | **Aplicada** (aprobación: 2026-08-09) |
| Fase 3 — Sugerencias | Listadas abajo — **no implementadas** |

### Qué se hizo en Fase 2

| ID | Acción |
|----|--------|
| C1 | Eliminado `src/components/EmailPasswordSignUp.tsx` |
| C2 | Eliminado `src/components/InstagramAuthNote.tsx` |
| C3 | Eliminado `instagramUsername` de `src/lib/instagram.ts` |
| C4 | Eliminado `isSafeInternalPath` de `src/lib/clerk-auth.ts` |
| C5 | Eliminados `requireApprovedProfile` / `ensureApprovedProfile` de `account-gate.ts` |
| C6 | Eliminado alias `adminDeleteEvent` de `actions.ts` |
| C7 | Quitado import sin uso `isAdminEmail` en `auth.ts` |
| C8 | Eliminado `ONBOARDING_STORAGE_KEY` de `onboarding.ts` |
| C9 | Simplificado `/after-auth` (sin sessionStorage); eliminado `syncInstagramHandle` huérfano |
| C10 | Quitados `/sign-in` y `/sign-up` del middleware |
| C11 | Eliminados `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` |

**No se tocó:** auth/contraseñas/Clerk, allowlist de admins, hint de login, mockups, supabase/, wrappers en uso, stubs de producto (reseñas, welcome-email).

---

## 8. Anexo — árbol de carpetas

```
src/
├── middleware.ts
├── app/
│   ├── layout.tsx, page.tsx          → shell + landing
│   ├── login/ registro/ crear-contrasena/
│   ├── after-auth/ completar-perfil/
│   ├── pendiente/ rechazado/
│   ├── eventos/ aplicar/ mis-postulaciones/ mi-perfil/
│   ├── dashboard/                    → panel marca
│   ├── admin/                        → panel admin
│   ├── sso-callback/
│   └── actions.ts
├── components/
├── db/                               → schema + Neon
└── lib/                              → auth, onboarding, IG, posts…
```

---

## 9. Sugerencias de mejora (Fase 3 — solo lista)

> **No implementadas.** Priorizá con el equipo qué abordar después.

### 9.1 Seguridad (prioridad alta)

| # | Sugerencia | Por qué | Qué ganás |
|---|------------|---------|-----------|
| SEC-1 | Mover emails admin a `ADMIN_EMAILS` en Vercel y sacar la lista hardcodeada del repo | Hoy cualquiera con el código ve quién es admin (S1) | Menos superficie + rotación fácil sin deploy de código |

> **SEC-1 aplicada (2026-08-09):** `admin-emails.ts` ya no hardcodea emails; fuente = `ADMIN_EMAILS`. Lista cargada en Vercel Production.
| SEC-2 | Revisar o endurecer `getLoginAccountHint` (rate limit, menos detalle, o solo post-login) | Permite enumerar emails y su estado (S2) | Menos fuga de información de cuentas |

> **SEC-2 aplicada (2026-08-09):** el hint solo devuelve `pending`/`rejected` (nunca `approved`); rate limit best-effort + delay mínimo. Sigue usándose solo tras un login fallido en la UI.
| SEC-3 | No loguear emails en el stub de welcome; cuando haya Resend, usar servicio real | PII en logs (S3) | Cumplimiento / higiene operativa |

> **SEC-3 aplicada (2026-08-09):** el stub ya no escribe email/nombre en consola. No toca la DB ni registros existentes.
| SEC-4 | Subir avatars/fotos de eventos a object storage (S3/R2/Supabase Storage), no data-URL en Neon | Base se infla y hay riesgo de abuso (S4) | Mejor performance, costos y límites claros |

> **SEC-4 aplicada (2026-08-09):** uploads nuevos van a **Vercel Blob** (`connecta-media`); Neon solo guarda la URL https. Las fotos viejas en data-URL **siguen mostrando** hasta que se reemplacen. No se borran registros.
| SEC-5 | Centralizar el gate de aprobación en un helper único usado por todas las rutas nuevas | Evita olvidar el check al agregar páginas (S5) | Menos bugs de autorización |
| SEC-6 | Allowlist de hosts en oEmbed TikTok / preview de posts | Evita SSRF / llamadas a URLs arbitrarias | Defensa en profundidad |
| SEC-7 | Validar edad (rango) y teléfono (formato) en onboarding | Hoy son flojos | Mejor calidad de datos y menos spam |

### 9.2 Performance

| # | Sugerencia | Por qué | Qué ganás |
|---|------------|---------|-----------|
| PERF-1 | Object storage + URLs cortas para imágenes (ligado a SEC-4) | Data-URLs grandes en JSONB | Páginas más rápidas, menos carga a Neon |
| PERF-2 | Paginar admin usuarios / postulaciones / feed si crecen | Hoy se cargan sets grandes | Admin usable con muchos usuarios |
| PERF-3 | Mover filtros pesados de cliente a servidor cuando la lista crezca (solicitudes, CRM) | Todo el array viaja al browser | Menos JS y mejor móvil |
| PERF-4 | Revisar `getDb()` (cliente HTTP por llamada) vs pool/reuso si hay cold starts | Patrón serverless simple | Menos latencia bajo carga |

### 9.3 Estructura / organización del código

| # | Sugerencia | Por qué | Qué ganás |
|---|------------|---------|-----------|
| STR-1 | Archivar o documentar claramente `supabase/` como legado | Confunde con Neon | Onboarding de devs más claro |
| STR-2 | Unificar helpers de path seguro (`next=`) en un solo lugar y usarlos | Había duplicación (C4 era el síntoma) | Menos copy-paste |
| STR-3 | Inlinear o unificar `AdminDeleteEventButton` → `DeleteEventButton` | Wrapper fino | Menos archivos |
| STR-4 | Separar `actions.ts` por dominio (eventos, perfiles, posts, admin) | Archivo muy grande | Más fácil de mantener |
| STR-5 | Decidir destino de `admin_allowlist` (usar o dropear de schema) | Tabla muerta vs lista en código | Una sola fuente de verdad |
| STR-6 | Implementar o esconder `/dashboard/resenas` | Stub visible | UX más honesta |

### 9.4 UX del formulario y filtros

| # | Sugerencia | Por qué | Qué ganás |
|---|------------|---------|-----------|
| UX-1 | Acortar o partir el onboarding en pasos con progreso | Formulario largo; abandono | Más altas tasas de completar perfil |
| UX-2 | Alinear email del form con el de Clerk (prefill + lock) | Pueden divergir | Menos confusión de soporte |
| UX-3 | Filtros del feed: más categorías reales desde DB, no solo chips hardcodeados | Categorías desconocidas caen a “lifestyle” | Búsqueda más fiel |
| UX-4 | Búsqueda de texto en feed de eventos y en CRM creadores | Hoy admin tiene search; marca/creador poco | Producto más usable |
| UX-5 | Feedback claro post-registro (“te falta el perfil” / “en revisión”) | El puente after-auth es genérico | Menos “¿qué pasó?” |
| UX-6 | Copy del botón default de OnboardingForm (“Continuar al registro”) → texto neutro | Resto del flujo clerk-first | Coherencia de producto |
| UX-7 | Preparar TikTok OAuth como fase de producto aparte (credenciales, tokens, scopes) | Hoy solo handle manual | Roadmap claro sin mezclar con limpieza |

---

*Fin del documento — Auditoría CONNECTA v1.1 (Fases 1–3)*
