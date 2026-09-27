import type { ReactNode } from "react";
import "./brand-ficha.css";

export function CreatorFicha({
  name,
  subtitle,
  subtitleHref,
  avatarUrl,
  initials,
  pill,
  rows,
  actions,
}: {
  name: string;
  subtitle: string | null;
  subtitleHref?: string | null;
  avatarUrl: string | null;
  initials: string;
  pill: string | null;
  rows: Array<[string, ReactNode]>;
  actions?: ReactNode;
}) {
  return (
    <div className="brand-ficha">
      <article className="brand-ficha-card">
        <div className="brand-ficha-top">
          <div className="brand-ficha-id">
            <div className="brand-ficha-avatar is-cover">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" />
              ) : (
                initials
              )}
            </div>
            <div className="brand-ficha-who">
              <div className="brand-ficha-titles">
                <h1>{name}</h1>
                {subtitle ? (
                  <p className="brand-ficha-sub">
                    {subtitleHref ? (
                      <a href={subtitleHref} target="_blank" rel="noopener noreferrer">
                        {subtitle}
                      </a>
                    ) : (
                      subtitle
                    )}
                  </p>
                ) : null}
              </div>
              {pill ? (
                <div className="brand-ficha-pills">
                  <span className="brand-ficha-pill">{pill}</span>
                </div>
              ) : null}
            </div>
          </div>
          {actions}
        </div>

        {rows.length > 0 ? (
          <section className="brand-ficha-block">
            <h2>El perfil</h2>
            {rows.map(([label, value]) => (
              <div className="brand-ficha-row" key={label}>
                <span>{label}</span>
                <div>{value}</div>
              </div>
            ))}
          </section>
        ) : null}
      </article>
    </div>
  );
}
