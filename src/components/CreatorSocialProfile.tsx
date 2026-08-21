"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCreatorPost,
  disconnectTikTok,
  previewCreatorPostUrl,
  syncTikTokProfile,
  updateSelfProfile,
} from "@/app/actions";
import { CreatorFeed } from "@/components/CreatorFeed";
import { initialsFromName, avatarColor } from "@/app/dashboard/brand-helpers";
import {
  CONTENT_THEME_GROUPS,
  PLATFORMS,
  PROVINCES,
  type OnboardingPayload,
  validateOnboarding,
} from "@/lib/onboarding";
import { instagramUrl, normalizeInstagramHandle } from "@/lib/instagram";
import { uploadConnectaImage } from "@/lib/blob-upload";
import { platformLabel, tiktokProfileUrl } from "@/lib/posts";
import type { CreatorPost, PostPlatform } from "@/db/schema";

const field =
  "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple";
const labelCls = "mb-1.5 block text-sm text-muted-dark";

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((x) => x !== value)
    : [...list, value];
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-left text-xs font-semibold transition ${
        active
          ? "border-purple bg-purple/30 text-white"
          : "border-white/10 bg-black/20 text-muted-dark hover:border-white/25 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

async function cropToSquareDataUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Imagen inválida"));
    el.src = dataUrl;
  });
  const size = 400;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) / 2;
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
  const out = canvas.toDataURL("image/jpeg", 0.82);
  return out.length > 450_000 ? canvas.toDataURL("image/jpeg", 0.6) : out;
}

function formatCount(n: number): string {
  if (!n) return "0";
  return n.toLocaleString("es-AR");
}

export function CreatorSocialProfile({
  initial,
  posts: initialPosts,
  tiktokConnected = false,
  tiktokConfigured = false,
  tiktokFlash = null,
}: {
  initial: OnboardingPayload;
  posts: CreatorPost[];
  tiktokConnected?: boolean;
  tiktokConfigured?: boolean;
  tiktokFlash?: "connected" | "error" | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [data, setData] = useState(initial);
  const [posts, setPosts] = useState(initialPosts);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [connected, setConnected] = useState(tiktokConnected);
  const [tiktokMsg, setTiktokMsg] = useState<string | null>(() => {
    if (tiktokFlash === "connected") {
      return "TikTok conectado. Username y seguidores sincronizados.";
    }
    if (tiktokFlash === "error") {
      return "No se pudo conectar TikTok. Intentá de nuevo.";
    }
    return null;
  });
  const [tiktokBusy, setTiktokBusy] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!editing) setData(initial);
  }, [initial, editing]);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  useEffect(() => {
    setConnected(tiktokConnected);
  }, [tiktokConnected]);

  const handle =
    normalizeInstagramHandle(data.instagram) ||
    (data.instagram.trim()
      ? `@${data.instagram.trim().replace(/^@/, "")}`
      : "");
  const igLink = instagramUrl(handle);
  const ttLink = tiktokProfileUrl(data.tiktok);
  const igFollowers =
    Number(String(data.followers || "").replace(/\D/g, "")) || 0;
  const ttFollowers =
    Number(String(data.tiktokFollowers || "").replace(/\D/g, "")) || 0;

  async function onSyncTikTok() {
    setTiktokBusy(true);
    setTiktokMsg(null);
    setError(null);
    try {
      const res = await syncTikTokProfile();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setTiktokMsg("Seguidores de TikTok actualizados.");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al sincronizar");
    } finally {
      setTiktokBusy(false);
    }
  }

  async function onDisconnectTikTok() {
    if (
      !confirm(
        "¿Desconectar TikTok? Se mantienen el @ y los seguidores guardados."
      )
    ) {
      return;
    }
    setTiktokBusy(true);
    setTiktokMsg(null);
    setError(null);
    try {
      const res = await disconnectTikTok();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setConnected(false);
      setTiktokMsg("TikTok desconectado.");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al desconectar");
    } finally {
      setTiktokBusy(false);
    }
  }

  const collabs = posts.filter((p) => p.brandLabel).length;
  const bio =
    data.contentThemes.slice(0, 3).join(" · ") ||
    "Creador de contenido en CONNECTA";
  const color = avatarColor(handle || data.fullName || "u");
  const initials = initialsFromName(data.fullName || handle || "U");

  function set<K extends keyof OnboardingPayload>(
    key: K,
    value: OnboardingPayload[K]
  ) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function onFileChange(file: File | null) {
    if (!file?.type.startsWith("image/")) return;
    try {
      const dataUrl = await cropToSquareDataUrl(file);
      const fd = new FormData();
      fd.set("folder", "avatars");
      fd.set("dataUrl", dataUrl);
      const { url } = await uploadConnectaImage(fd);
      set("avatarUrl", url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo subir la imagen"
      );
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const normalized: OnboardingPayload = {
      ...data,
      role: "creator",
      instagram:
        normalizeInstagramHandle(data.instagram) || data.instagram.trim(),
      tiktok: data.tiktok.trim()
        ? data.tiktok.startsWith("@")
          ? data.tiktok.trim()
          : `@${data.tiktok.trim().replace(/^@/, "")}`
        : "",
      fullName: data.fullName.trim(),
      contactEmail: data.contactEmail.trim().toLowerCase(),
    };
    const result = validateOnboarding(normalized);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateSelfProfile(normalized);
      setData(normalized);
      setEditing(false);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
      />

      {saved && !editing ? (
        <p className="mb-5 rounded-xl border border-ok/40 bg-ok/10 px-4 py-3 text-sm font-semibold text-ok">
          Perfil actualizado.
        </p>
      ) : null}

      {tiktokMsg ? (
        <p
          className={`mb-5 rounded-xl border px-4 py-3 text-sm font-semibold ${
            tiktokFlash === "error" &&
            tiktokMsg.startsWith("No se pudo")
              ? "border-red-400/40 bg-red-500/10 text-red-200"
              : "border-ok/40 bg-ok/10 text-ok"
          }`}
        >
          {tiktokMsg}
        </p>
      ) : null}

      <section className="mb-7 rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-muted-dark">
              TikTok
            </h2>
            {connected ? (
              <p className="mt-1 text-sm text-white">
                Conectado
                {data.tiktok ? (
                  <>
                    {" "}
                    como{" "}
                    <span className="font-bold text-purple-2">{data.tiktok}</span>
                  </>
                ) : null}
                {ttFollowers > 0 ? (
                  <span className="text-muted-dark">
                    {" "}
                    · {formatCount(ttFollowers)} seguidores
                  </span>
                ) : null}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-dark">
                Conectá tu cuenta para sincronizar @ y seguidores
                automáticamente.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {connected ? (
              <>
                <button
                  type="button"
                  disabled={tiktokBusy || !tiktokConfigured}
                  onClick={onSyncTikTok}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-white hover:border-purple-2 disabled:opacity-50"
                >
                  {tiktokBusy ? "Sincronizando…" : "Volver a sincronizar"}
                </button>
                <button
                  type="button"
                  disabled={tiktokBusy}
                  onClick={onDisconnectTikTok}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-muted-dark hover:text-white disabled:opacity-50"
                >
                  Desconectar
                </button>
              </>
            ) : tiktokConfigured ? (
              <a
                href="/api/tiktok/connect"
                className="rounded-full bg-purple px-4 py-2 text-sm font-bold text-white hover:bg-purple-2"
              >
                Conectar TikTok
              </a>
            ) : (
              <span className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-muted-dark">
                OAuth no configurado
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Header */}
      <div className="flex flex-wrap items-start gap-5 border-b border-white/10 pb-7 sm:gap-7">
        <button
          type="button"
          disabled={!editing}
          onClick={() => editing && fileRef.current?.click()}
          className={`relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[26px] border border-white/10 sm:h-[100px] sm:w-[100px] ${
            editing ? "cursor-pointer ring-2 ring-purple/40" : "cursor-default"
          }`}
          aria-label={editing ? "Cambiar foto" : "Foto de perfil"}
        >
          {data.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span
              className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-white"
              style={{ background: color }}
            >
              {initials}
            </span>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold sm:text-[22px]">
            {handle || data.fullName || "Sin usuario"}
          </h1>
          {data.fullName && handle ? (
            <p className="mt-0.5 text-sm text-muted-dark">{data.fullName}</p>
          ) : null}
          <p className="mt-2 max-w-md text-sm text-muted-dark">{bio}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {data.contentThemes[0] ? (
              <span className="rounded-full bg-purple/20 px-3 py-1 text-xs font-bold text-purple-2">
                {data.contentThemes[0]}
              </span>
            ) : null}
            {data.province ? (
              <span className="rounded-full bg-purple/20 px-3 py-1 text-xs font-bold text-purple-2">
                {data.province}
              </span>
            ) : null}
            {igLink ? (
              <a
                href={igLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-muted-dark hover:border-purple-2 hover:text-white"
              >
                Instagram
              </a>
            ) : null}
            {ttLink ? (
              <a
                href={ttLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-muted-dark hover:border-purple-2 hover:text-white"
              >
                TikTok
              </a>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-6">
            <Stat value={formatCount(posts.length)} label="Publicaciones" />
            <Stat value={formatCount(igFollowers)} label="Seguidores IG" />
            {data.tiktok ? (
              <Stat value={formatCount(ttFollowers)} label="Seguidores TikTok" />
            ) : null}
            <Stat value={formatCount(collabs)} label="Colaboraciones" />
          </div>
          {!editing && igFollowers === 0 ? (
            <p className="mt-3 text-xs text-muted-dark">
              Todavía no cargaste seguidores. Tocá{" "}
              <button
                type="button"
                className="font-bold text-purple-2 hover:underline"
                onClick={() => {
                  setEditing(true);
                  setSaved(false);
                }}
              >
                Editar perfil
              </button>{" "}
              y completá el número (Instagram no permite sincronizarlo
              automáticamente).
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {!editing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setAdding(true);
                  setError(null);
                }}
                className="rounded-full bg-purple px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-2"
              >
                + Nueva publicación
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setSaved(false);
                  setError(null);
                }}
                className="rounded-full border border-white/20 px-4 py-2.5 text-sm font-bold text-white hover:border-purple-2"
              >
                Editar perfil
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setData(initial);
                setEditing(false);
                setError(null);
              }}
              className="rounded-full border border-white/15 px-4 py-2.5 text-sm font-bold text-muted-dark hover:text-white"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {!editing ? (
        <div className="pt-7">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-muted-dark">
            Feed de acciones
          </h2>
          <CreatorFeed posts={posts} editable creatorHandle={handle} />
        </div>
      ) : (
        <form onSubmit={saveProfile} className="mt-8 space-y-8">
          <section>
            <h2 className="text-lg font-bold">Datos generales</h2>
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className={labelCls}>Nombre y apellido *</span>
                <input
                  className={field}
                  value={data.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  required
                />
              </label>
              <label className="block">
                <span className={labelCls}>Usuario de Instagram *</span>
                <input
                  className={field}
                  value={data.instagram}
                  onChange={(e) => set("instagram", e.target.value)}
                  required
                />
              </label>
              <label className="block">
                <span className={labelCls}>
                  Usuario de TikTok
                  {connected ? " (sincronizado)" : " (opcional)"}
                </span>
                <input
                  className={field}
                  value={data.tiktok}
                  onChange={(e) => set("tiktok", e.target.value)}
                  disabled={connected}
                />
                {connected ? (
                  <span className="mt-1 block text-xs text-muted-dark">
                    Viene de la cuenta conectada. Desconectá para editarlo a
                    mano.
                  </span>
                ) : null}
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelCls}>Seguidores Instagram</span>
                  <input
                    className={field}
                    inputMode="numeric"
                    value={data.followers}
                    onChange={(e) => set("followers", e.target.value)}
                    placeholder="ej. 24500"
                  />
                  {igLink ? (
                    <a
                      href={igLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs font-semibold text-purple-2 hover:underline"
                    >
                      Abrir Instagram para copiar el número →
                    </a>
                  ) : null}
                </label>
                <label className="block">
                  <span className={labelCls}>
                    Seguidores TikTok
                    {connected ? " (sincronizado)" : ""}
                  </span>
                  <input
                    className={field}
                    inputMode="numeric"
                    value={data.tiktokFollowers}
                    onChange={(e) => set("tiktokFollowers", e.target.value)}
                    placeholder="ej. 12000"
                    disabled={connected}
                  />
                  {!connected && ttLink ? (
                    <a
                      href={ttLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs font-semibold text-purple-2 hover:underline"
                    >
                      Abrir TikTok para copiar el número →
                    </a>
                  ) : null}
                </label>
              </div>
              <label className="block">
                <span className={labelCls}>Provincia *</span>
                <select
                  className={field}
                  value={data.province}
                  onChange={(e) => set("province", e.target.value)}
                  required
                >
                  <option value="">Elegí una opción</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelCls}>Edad</span>
                  <input
                    className={field}
                    type="number"
                    value={data.age}
                    onChange={(e) => set("age", e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>Teléfono</span>
                  <input
                    className={field}
                    value={data.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </label>
              </div>
              <label className="block">
                <span className={labelCls}>Email *</span>
                <input
                  className={field}
                  type="email"
                  value={data.contactEmail}
                  onChange={(e) => set("contactEmail", e.target.value)}
                  required
                />
              </label>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold">Temáticas *</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {CONTENT_THEME_GROUPS.map((group) => (
                <div key={group.group}>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-purple-2">
                    {group.group}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((opt) => (
                      <Chip
                        key={opt}
                        active={data.contentThemes.includes(opt)}
                        onClick={() =>
                          set(
                            "contentThemes",
                            toggleInList(data.contentThemes, opt)
                          )
                        }
                      >
                        {opt}
                      </Chip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold">Plataformas *</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {PLATFORMS.map((opt) => (
                <Chip
                  key={opt}
                  active={data.platforms.includes(opt)}
                  onClick={() =>
                    set("platforms", toggleInList(data.platforms, opt))
                  }
                >
                  {opt}
                </Chip>
              ))}
            </div>
          </section>

          {error ? (
            <p className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-purple px-8 py-3.5 text-sm font-bold text-white hover:bg-purple-2 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      )}

      {adding ? (
        <AddPostModal
          onClose={() => setAdding(false)}
          onCreated={(post) => {
            setPosts((prev) => [post, ...prev]);
            setAdding(false);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <b className="block text-[17px] font-extrabold">{value}</b>
      <span className="text-xs text-muted-dark">{label}</span>
    </div>
  );
}

function AddPostModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (post: CreatorPost) => void;
}) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [brandLabel, setBrandLabel] = useState("");
  const [thumbUrl, setThumbUrl] = useState("");
  const [manualThumb, setManualThumb] = useState("");
  const [likes, setLikes] = useState("");
  const [comments, setComments] = useState("");
  const [views, setViews] = useState("");
  const [platform, setPlatform] = useState<PostPlatform | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [previewing, setPreviewing] = useState(false);

  async function onUrlBlur() {
    const v = url.trim();
    if (!v) {
      setPlatform(null);
      setThumbUrl("");
      return;
    }
    setPreviewing(true);
    try {
      const res = await previewCreatorPostUrl(v);
      if (!res.ok) {
        setPlatform(null);
        setThumbUrl("");
        setError(res.error);
        return;
      }
      setError(null);
      setPlatform(res.platform);
      setThumbUrl(res.thumbUrl || "");
    } finally {
      setPreviewing(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await createCreatorPost({
          url,
          caption,
          brandLabel,
          thumbUrl: manualThumb || thumbUrl || undefined,
          likesCount: likes,
          commentsCount: comments,
          viewsCount: views,
        });
        onCreated(res.post);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo publicar");
      }
    });
  }

  const previewSrc = manualThumb || thumbUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-ink-2 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-dark hover:text-white"
        >
          ✕
        </button>
        <h3 className="mb-5 text-lg font-extrabold">Nueva publicación</h3>

        <label className="mb-4 block">
          <span className={labelCls}>
            Link del posteo (Instagram, TikTok o YouTube)
          </span>
          <input
            className={field}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={onUrlBlur}
            placeholder="https://..."
            required
          />
        </label>

        <div className="mb-4 text-xs text-muted-dark">
          Plataforma:{" "}
          <span className="font-bold text-white">
            {previewing
              ? "Detectando…"
              : platform
                ? platformLabel(platform)
                : "—"}
          </span>
        </div>

        <div className="mb-4 aspect-square max-w-[140px] overflow-hidden rounded-xl border border-dashed border-white/15 bg-black/30">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center p-3 text-center text-[11px] text-muted-dark">
              La portada aparece acá una vez que pegues el link
            </div>
          )}
        </div>

        {platform === "instagram" ? (
          <label className="mb-4 block">
            <span className={labelCls}>URL de imagen de portada (opcional)</span>
            <input
              className={field}
              value={manualThumb}
              onChange={(e) => setManualThumb(e.target.value)}
              placeholder="https://..."
            />
            <p className="mt-1 text-[11px] text-muted-dark">
              Instagram no permite traer la portada automáticamente. Podés
              pegar una URL de imagen o dejarlo vacío.
            </p>
          </label>
        ) : null}

        <label className="mb-4 block">
          <span className={labelCls}>
            ¿Colaboración con una marca? (opcional)
          </span>
          <input
            className={field}
            value={brandLabel}
            onChange={(e) => setBrandLabel(e.target.value)}
            placeholder="Nombre de la marca"
          />
        </label>

        <label className="mb-4 block">
          <span className={labelCls}>Copy *</span>
          <textarea
            className={field}
            rows={3}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Contá de qué se trató esta acción…"
            required
          />
        </label>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <label className="block">
            <span className={labelCls}>Likes</span>
            <input
              className={field}
              inputMode="numeric"
              value={likes}
              onChange={(e) => setLikes(e.target.value)}
              placeholder="1200"
            />
          </label>
          <label className="block">
            <span className={labelCls}>Comentarios</span>
            <input
              className={field}
              inputMode="numeric"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="45"
            />
          </label>
          <label className="block">
            <span className={labelCls}>Vistas</span>
            <input
              className={field}
              inputMode="numeric"
              value={views}
              onChange={(e) => setViews(e.target.value)}
              placeholder="opcional"
            />
          </label>
        </div>
        <p className="mb-4 text-[11px] text-muted-dark">
          Instagram/TikTok no dejan leer likes solos. Cargá los números del
          posteo (los ves al pasar el mouse en el feed).
        </p>

        {error ? (
          <p className="mb-3 text-sm font-semibold text-danger">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-purple py-3 text-sm font-bold text-white hover:bg-purple-2 disabled:opacity-60"
        >
          {pending ? "Publicando…" : "Publicar"}
        </button>
      </form>
    </div>
  );
}
