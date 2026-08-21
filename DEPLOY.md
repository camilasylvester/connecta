# Deploy CONNECTA (Vercel + Neon + Clerk)

## 1. Neon

1. https://console.neon.tech → New project (región cerca: São Paulo si está, o US East)
2. Copiá `DATABASE_URL`
3. SQL Editor → pegá [`drizzle/0000_init.sql`](drizzle/0000_init.sql) → Run

```sql
insert into admin_allowlist (email) values ('tu@email.com');
```

## 2. Clerk

1. https://dashboard.clerk.com → Create application
2. Email auth ON
3. Paths: Sign-in URL `/login`, Sign-up `/registro`
4. Allowed redirect / domains: `https://www.connectainf.com`, `https://local.connectainf.com` (dev), y localhost. **No uses solo `*.vercel.app`** para links que compartís.
5. Copiá `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY`

## 3. Vercel env vars

En el proyecto `connecta`:

- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` = `/login`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` = `/registro`
- `NEXT_PUBLIC_SITE_URL` = `https://www.connectainf.com`  
  (importante: **no** pongas `connecta-tau.vercel.app`; los links de “aplicar” salen de acá)
- `ADMIN_EMAILS` = emails de admin separados por coma (ej. `vos@email.com,otro@email.com`)
- `BLOB_READ_WRITE_TOKEN` = token de Vercel Blob (Storage → Blob store `connecta-media`)

Sacá las viejas de Supabase si siguen.

Redeploy.

## 4. Probar

1. Admin: `/login` → Admin → crear cuenta con el email allowlisted → `/admin`
2. Marca: crear evento → copiar link
3. Influencer: abrir link → postularse
4. Marca/Admin: aprobar / rechazar
