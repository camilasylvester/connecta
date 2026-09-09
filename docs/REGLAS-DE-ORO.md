# Reglas de oro — CONNECTA

Normas de trabajo para todos los que tocamos este repo.

Escribí esto después de revisarme el historial completo del proyecto. No son reglas de manual: cada una sale de algo que ya nos pasó acá o de algo que vi que estaba por pasar.

**Leelo entero una vez antes de tu primer commit.** Después volvé a la [chuleta del final](#chuleta-los-comandos-de-todos-los-días) cuando necesites los comandos.

---

## Antes que nada: esto es una app viva

`www.connectainf.com` está en producción con usuarios reales — marcas publicando eventos y creadores postulándose. Cada push a `main` **se despliega solo en Vercel**. No hay staging entre tu commit y la gente usando la página.

Eso cambia todo: no existe "lo subo y después veo". Si rompés `main`, la página está rota para todos hasta que alguien la arregle.

---

## Las 10 reglas

### 1. Todos los commits tienen que estar marcados

Nada de "cambios", "update", "arreglos varios" o "asd". Un commit tiene que decir **qué** cambió y **por qué**, y arrancar con una etiqueta que diga de qué tipo es.

**Formato:**

```
etiqueta: qué cambió, en una línea, en castellano

Por qué se hizo: el problema real que resuelve.
Cómo se probó: los pasos concretos.
Qué puede romperse: si aplica.
```

**Etiquetas:**

| Etiqueta | Cuándo | Ejemplo |
|---|---|---|
| `fix:` | Arreglás algo roto | `fix: el login se quedaba en Cargando con la URL de vercel` |
| `feat:` | Función nueva | `feat: export CSV de creadores para el newsletter` |
| `sec:` | Seguridad | `sec: rate limit en login por handle de Instagram` |
| `ui:` | Solo visual, sin cambiar lógica | `ui: portfolio del creador a ancho completo en desktop` |
| `db:` | Toca la base de datos | `db: agregar columna telefono a profiles` |
| `docs:` | Solo documentación | `docs: actualizar bitácora` |
| `chore:` | Config, dependencias, limpieza | `chore: subir Next a 16.2.10` |

La etiqueta no es decoración: permite que cualquiera escanee `git log --oneline` y encuentre en diez segundos "el último cambio de seguridad" o "cuándo se tocó la base".

**Un commit = una idea.** Si tu mensaje necesita un "y" para explicarse ("arreglo el login y cambio los colores"), son dos commits. Commits chicos son fáciles de entender, fáciles de revisar y fáciles de revertir cuando salen mal.

---

### 2. Tenés que poder explicar todo lo que subís

Si no podés explicar en castellano, a alguien que no programó eso, **qué hace tu código y por qué lo hiciste así**, no está listo para subir.

Esto vale especialmente para código que copiaste de algún lado o que te generó una IA. Ojo con esto último: es la forma más rápida de meter en producción algo que nadie del equipo entiende y que nadie va a poder arreglar cuando falle a las 11 de la noche.

**La prueba:** imaginate que dentro de tres meses alguien te pregunta por qué esa función está así. Si tu respuesta sería "no me acuerdo" o "funcionaba", falta trabajo.

Si hay algo que **no** entendés del todo pero necesitás subir igual, decilo explícitamente en el commit y en la bitácora: *"esto lo resolví así porque era lo único que funcionaba, no tengo claro por qué falla la otra forma"*. Eso es honesto y sirve. Fingir que lo entendés, no.

---

### 3. Todo tiene que estar comentado

Los comentarios explican **por qué**, no **qué**. El código ya dice qué hace; lo que se pierde con el tiempo es la razón.

```ts
// ❌ Inútil: repite lo que el código ya dice
// suma 1 al contador
contador += 1;

// ✅ Útil: explica algo que el código no puede decir
// BOM helps Excel open UTF-8 with accents correctly
return `﻿${lines.join("\r\n")}`;
```

**Qué comentar sí o sí:**

- **Toda función exportada**, con un `/** ... */` arriba diciendo qué hace y qué devuelve.
- **Cualquier decisión rara.** Si alguien puede mirar tu código y pensar "¿por qué está hecho así?", ese es el comentario que falta.
- **Los workarounds.** Si algo está así porque Clerk/Vercel/Neon se comporta raro, escribilo. Ese comentario le ahorra media tarde al próximo.
- **Reglas de negocio.** "Los creadores pendientes pueden postularse igual" es una decisión de producto, no algo obvio del código.
- **Los números mágicos.** `const RATE_MAX = 8;` — ¿por qué 8?

**Qué NO hacer:**

- No comentes código viejo "por las dudas". Para eso está git. Borralo.
- No dejes `console.log` de depuración ni `TODO` sin dueño. Si es un TODO real: `// TODO(camila): validar el teléfono antes del envío`.

El código y los comentarios de este repo están **en inglés** — fijate `src/lib/csv-export.ts`, que es el estilo que venimos usando. Seguí esa convención. Los commits, la bitácora y los mensajes al usuario van **en castellano**.

---

### 4. Antes de tocar nada, mirá cómo está la página

**Este es el punto donde se pierde trabajo.** El orden importa.

Antes de empezar a programar, y siempre antes de traer cambios:

```bash
git status              # 1. ¿tengo cambios sin guardar?
git fetch               # 2. bajar info del remoto (NO toca tus archivos)
git log --oneline HEAD..origin/main    # 3. ¿qué hicieron los demás?
git diff --stat HEAD origin/main       # 4. ¿qué archivos tocaron?
```

**Recién ahí** decidís:

- **Si `git status` muestra cambios tuyos sin commitear → NO traigas nada todavía.** Commiteálos primero, o guardalos con `git stash`. Si traés cambios encima de trabajo sin guardar, o te da conflicto o perdés cosas.
- **Si los demás tocaron los mismos archivos que vos ibas a tocar → hablalo antes de programar**, no después. Dos personas rehaciendo la misma pantalla es medio día tirado.
- **Si está todo limpio y no hay pisadas** → `git pull --ff-only` y a trabajar.

`git fetch` es siempre seguro: baja la información pero **no modifica ni un archivo tuyo**. Podés correrlo cuando quieras. El que cambia tus archivos es `pull`/`merge`, y ese es el que se mira antes.

**Y después de traer cambios, abrí la página y probala.** `npm run dev` y navegá lo que tocaste. Que compile no quiere decir que ande.

---

### 5. No trabajes directo sobre `main`

Hoy todos pusheamos directo a `main`. Cuando revisé el historial me encontré con un merge automático (`3abb3d6`, 19/08): dos personas laburando sobre lo mismo el mismo día y git uniendo las dos puntas solo. Siendo tres eso se banca; siendo más, se rompe.

**Una rama por tarea:**

```bash
git switch -c fix/login-instagram     # arrancás desde main actualizado
# ... trabajás, commiteás ...
git push -u origin fix/login-instagram
```

Después abrís un Pull Request en GitHub, alguien lo mira, y recién ahí entra a `main`.

**Nombres de rama:** `tipo/descripcion-corta` → `fix/login-cargando`, `feat/export-csv`, `ui/portfolio-desktop`.

Ventajas concretas: tu trabajo a medio hacer no rompe producción, alguien revisa antes de que salga, y si algo sale mal se revierte una rama entera en vez de pescar commits sueltos.

---

### 6. Nunca subas secretos

`.env.local` tiene las claves reales de Neon, Clerk y Vercel Blob. **Está en `.gitignore` y ahí se queda.**

- Si necesitás una variable nueva, agregala a **`.env.local.example`** con un valor falso (`sk_test_xxx`) y un comentario de para qué sirve. Nunca el valor real.
- El valor real va en el dashboard de Vercel y se comparte por un canal privado, nunca por el repo, ni por un issue, ni por captura de pantalla.
- Si alguna vez subiste una clave por error: **avisá al toque y rotala**. Borrar el commit no alcanza, ya quedó en el historial de GitHub y en la copia de cada uno.

Ojo también con `.env.local.example`: es un archivo versionado y **no** es lo mismo que tu `.env.local`. Copialo (`cp .env.local.example .env.local`), no lo renombres.

---

### 7. La base de datos no se edita, se le agrega

Las migraciones viven en `drizzle/` y están numeradas (`0000_init.sql` … `0006_post_metrics.sql`).

- **Nunca edites una migración que ya se corrió.** Aunque tenga un error. Aunque sea una línea. Si ya se aplicó en producción, editarla hace que tu base y la de producción queden distintas sin que nadie se entere.
- Para cambiar algo, **creá la migración siguiente** (`0007_...sql`) que arregla lo anterior.
- Todo cambio de base va en el commit con `db:` y **anotado en la bitácora con todas las letras**. Es lo más caro de revertir.
- Avisale al equipo antes de mergear un `db:`. Los demás van a necesitar correr la migración en su base local.

---

### 8. Probá antes de pushear

Mínimo, antes de subir cualquier cosa:

```bash
npm run build     # ¿compila? si falla acá, falla en Vercel
npm run lint      # ¿pasa el linter?
npm run dev       # abrí el navegador y usá lo que tocaste
```

Y probá **el camino completo del usuario**, no solo tu pantalla. Si tocaste el login, logueate como marca, como creador y como admin — son tres flujos distintos y en este proyecto ya se rompieron varias veces por separado.

Acordate de que `main` se despliega solo. "Compila en mi máquina" no es haber probado.

---

### 9. Avisá qué estás tocando

Antes de arrancar algo grande, decilo en el grupo: *"agarro el registro de creadores hoy"*. Yo voy a hacer lo mismo.

Diez segundos de mensaje evitan que dos rehagamos la misma pantalla. Mirando el historial, las zonas calientes de este repo —donde más nos pisamos— son:

- `src/app/login/` y `src/app/registro/` (el auth se tocó ~8 veces en un mes)
- `src/app/actions.ts` (lo usa medio proyecto)
- `src/db/schema.ts` (cambiarlo afecta a todos)
- `src/middleware.ts`

---

### 10. Dejá el rastro: actualizá la bitácora

Todo cambio que llega a `main` se anota en [BITACORA.md](BITACORA.md), **en el mismo commit** que el cambio.

El commit explica el cambio a quien programa. La bitácora se lo explica **al resto del equipo** —y a vos mismo dentro de seis meses—. No es lo mismo y no se reemplazan.

---

## Si algo sale mal

**Traje cambios y se rompió todo.**
Volvé atrás: `git reset --hard ORIG_HEAD` deshace el último merge/pull. Ojo: pierde cambios sin commitear.

**Tengo un conflicto y no entiendo nada.**
No adivines ni borres lo del otro para que compile. `git merge --abort` cancela todo y te deja como estabas. Después hablalo con quien escribió la otra mitad.

**Rompí producción.**
Avisá primero, arreglá después. Lo más rápido es revertir en Vercel al deploy anterior (Deployments → el último que andaba → Promote to Production), y recién ahí buscar el error con calma. Para deshacer un commit puntual: `git revert <hash>` — crea un commit nuevo que lo deshace, sin reescribir historia.

**Nunca `git push --force` sobre `main`.** Reescribe la historia compartida y le rompe el repo a todos los demás. Si creés que lo necesitás, preguntá antes.

---

## Chuleta: los comandos de todos los días

```bash
# --- Arrancar el día ---
git status                              # ¿tengo algo sin guardar?
git fetch                               # bajar info (no toca archivos)
git log --oneline HEAD..origin/main     # ¿qué hicieron los demás?
git pull --ff-only                      # traerlo (solo si está limpio)

# --- Trabajar ---
git switch -c fix/lo-que-sea            # rama nueva desde main
npm run dev                             # levantar en localhost:3000

# --- Guardar ---
git add -p                              # revisar cambio por cambio antes de agregar
git commit                              # abre el editor: título + por qué + cómo se probó
git log -1 --format=%h                  # el hash, para anotarlo en la bitácora

# --- Subir ---
npm run build && npm run lint           # que no explote en Vercel
git push -u origin fix/lo-que-sea       # y abrís el PR en GitHub

# --- Emergencias ---
git stash                               # guardar cambios a un costado
git stash pop                           # recuperarlos
git merge --abort                       # cancelar un merge conflictivo
git reset --hard ORIG_HEAD              # deshacer el último pull/merge
git revert <hash>                       # deshacer un commit ya subido
```

**El comando más útil de todos es `git status`.** Ante la duda, corralo.

---

## Resumen en cinco líneas

1. Commit marcado con etiqueta, que diga qué y por qué.
2. Si no lo podés explicar, no lo subas.
3. Comentá el porqué, no el qué.
4. `git status` + `git fetch` **antes** de traer nada.
5. Anotalo en la bitácora, en el mismo commit.
