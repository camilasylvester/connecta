# CONNECTA

Plataforma real para que marcas publiquen eventos con link privado e influencers se postulen.

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
