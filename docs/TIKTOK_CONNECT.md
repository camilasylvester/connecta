# TikTok Connect — Redirect URIs y prueba sandbox

Connecta vincula TikTok a un creador **ya logueado con Clerk**. No es “entrar a Connecta con TikTok”.

## Redirect URIs (obligatorios en el portal)

Registrar exactamente (HTTPS, sin query ni hash):

| Entorno | URI |
|---------|-----|
| Producción | `https://www.connectainf.com/api/tiktok/callback` |
| Local (HTTPS) | `https://local.connectainf.com/api/tiktok/callback` |

TikTok **no** acepta `http://localhost`.

## Scopes

- `user.info.basic`
- `user.info.profile` → username
- `user.info.stats` → follower_count

## Env

```bash
TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...
TIKTOK_REDIRECT_URI=https://www.connectainf.com/api/tiktok/callback
```

En local con `npm run dev:prod-local`, usá el redirect de `local.connectainf.com` y la misma URI en el portal.

## Cómo probar

1. Cargar las tres vars en `.env.local` (y en Vercel para prod).
2. Login como creator aprobado → `/mi-perfil`.
3. “Conectar TikTok” → autorizar en TikTok → volver a `/mi-perfil?tiktok=connected`.
4. Verificar `@` + seguidores; “Volver a sincronizar”; “Desconectar” (limpia tokens, deja handle).

## Endpoints del repo

- `GET /api/tiktok/connect` — inicia OAuth (requiere sesión Clerk + rol creator/admin)
- `GET /api/tiktok/callback` — exchange + sync + redirect a mi-perfil
