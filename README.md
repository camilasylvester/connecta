# CONNECTA

Plataforma real para que marcas publiquen eventos con link privado e influencers se postulen.

## Si vas a programar acá, leé esto primero

- **[docs/REGLAS-DE-ORO.md](docs/REGLAS-DE-ORO.md)** — cómo trabajamos: commits, comentarios,
  ramas y qué mirar antes de traer cambios para no pisar el trabajo de otro. **Obligatorio
  antes del primer commit.**
- **[docs/BITACORA.md](docs/BITACORA.md)** — qué se cambió, cuándo y por qué. Empezá por acá
  para saber en qué estado está el proyecto.
- **[docs/TAREAS.md](docs/TAREAS.md)** — qué falta hacer, priorizado y estimado. Cada tarea
  tiene un ID (`T-01`…) para usar en los commits.

> `main` se despliega solo a producción (www.connectainf.com). No hay staging.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- **Neon** (Postgres)
- **Clerk** (auth / magic link / email)
- Drizzle ORM
- Deploy: Vercel

## Setup

### 1. Neon

1. Creá un proyecto en https://console.neon.tech
2. Copiá el connection string → `DATABASE_URL`
3. En el SQL Editor de Neon, corré [`drizzle/0000_init.sql`](drizzle/0000_init.sql)

### 2. Clerk

1. Creá una app en https://dashboard.clerk.com
2. Copiá Publishable Key + Secret Key
3. En Clerk → Paths: Sign-in `/login`, Sign-up `/registro`
4. Habilitá Email (OTP / magic link)

### 3. Env

```bash
cp .env.local.example .env.local
# completá DATABASE_URL + Clerk keys + SITE_URL
npm install
npm run dev
```

### 4. Admin

Los admins salen de la variable `ADMIN_EMAILS` (emails separados por coma) en `.env.local` / Vercel. No se elige “soy admin” desde el formulario.

## Roles

| Rol | Entrada | Ve |
|-----|---------|-----|
| **Admin** | Login → Admin | Todo (`/admin`) |
| **Marca** | Login → Marca | Eventos y solicitudes (`/dashboard`) |
| **Influencer** | Login / link `/aplicar/...` | Postulaciones (`/mis-postulaciones`) |

## Deploy

Ver [DEPLOY.md](DEPLOY.md). Producción: https://www.connectainf.com

Guía para entender el proyecto: [ENTENDER_PROYECTO.md](ENTENDER_PROYECTO.md).

## Mockups

Referencia visual en [`mockups/`](mockups/).
