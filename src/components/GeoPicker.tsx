"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  GEO_COUNTRIES,
  GEO_SEP,
  geoCountry,
  geoPath,
  loadGeoCountry,
  removeGeoPath,
  shortRegionName,
  type GeoCountry,
  type GeoCountryCode,
  type GeoCountryData,
  type GeoUbicacion,
} from "@/lib/geo";
import "./geo-picker.css";

/** Minúsculas y sin tildes: "cordoba" encuentra "Córdoba". */
function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Con 8.000 municipios (España) no tiene sentido pintar todo: se muestran los
// primeros que coinciden y se invita a seguir escribiendo.
const MAX_OPTIONS = 60;

/**
 * Buscador con lista desplegable. Controlado por `value`; al elegir llama a
 * `onSelect`. Con `clearOnSelect` sirve para "agregar" (filtros multi-selección).
 */
export function GeoCombobox({
  options,
  value = "",
  onSelect,
  placeholder,
  disabled = false,
  clearOnSelect = false,
  labelFor,
  display = (s: string) => s,
  inline = false,
}: {
  options: string[];
  value?: string;
  onSelect: (option: string) => void;
  placeholder: string;
  disabled?: boolean;
  clearOnSelect?: boolean;
  labelFor?: string;
  display?: (option: string) => string;
  /** Lista en el flujo (no flotante): para usarlo adentro de un panel con scroll. */
  inline?: boolean;
}) {
  const listId = useId();
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Mientras no escribe, el input muestra lo elegido.
  const text = query ?? (clearOnSelect ? "" : display(value));

  const matches = useMemo(() => {
    const q = fold((query ?? "").trim());
    const list = q ? options.filter((o) => fold(o).includes(q)) : options;
    // Primero los que empiezan con lo escrito ("San" → "San Isidro" antes que "Villa San...").
    if (q) list.sort((a, b) => Number(!fold(a).startsWith(q)) - Number(!fold(b).startsWith(q)));
    return list;
  }, [options, query]);
  const shown = matches.slice(0, MAX_OPTIONS);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery(null);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function choose(option: string) {
    onSelect(option);
    setQuery(null);
    setOpen(false);
    setActive(0);
  }

  return (
    <div className="geo-combo" ref={wrapRef}>
      <input
        id={labelFor}
        className="geo-combo-input"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={text}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((i) => Math.min(i + 1, shown.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            if (open && shown[active]) {
              e.preventDefault();
              choose(shown[active]);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
            setQuery(null);
          }
        }}
      />
      {open && !disabled ? (
        <ul
          className={`geo-combo-list${inline ? " geo-combo-list--inline" : ""}`}
          id={listId}
          role="listbox"
        >
          {shown.length === 0 ? (
            <li className="geo-combo-empty">Sin resultados</li>
          ) : (
            shown.map((option, i) => (
              <li
                key={option}
                role="option"
                aria-selected={option === value}
                className={`geo-combo-option${i === active ? " is-active" : ""}${
                  option === value ? " is-selected" : ""
                }`}
                // mousedown para ganarle al blur del input
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(option);
                }}
                onMouseEnter={() => setActive(i)}
              >
                {display(option)}
              </li>
            ))
          )}
          {matches.length > shown.length ? (
            <li className="geo-combo-more">
              {matches.length - shown.length} más… seguí escribiendo para achicar la lista.
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

/** Carga los datos de un país. `null` mientras baja o si no hay país. */
export function useGeoCountry(code: GeoCountryCode | null | undefined) {
  const [state, setState] = useState<{
    code: GeoCountryCode | null;
    data: GeoCountryData | null;
    error: string | null;
  }>({ code: null, data: null, error: null });

  useEffect(() => {
    if (!code) return;
    let alive = true;
    loadGeoCountry(code)
      .then((data) => alive && setState({ code, data, error: null }))
      .catch((err: unknown) =>
        alive &&
        setState({
          code,
          data: null,
          error: err instanceof Error ? err.message : "No se pudo cargar la lista.",
        })
      );
    return () => {
      alive = false;
    };
  }, [code]);

  // Si el país cambió y todavía no llegó la respuesta, no devolver el anterior.
  const fresh = state.code === code;
  return {
    data: fresh ? state.data : null,
    error: fresh ? state.error : null,
    loading: Boolean(code) && (!fresh || (!state.data && !state.error)),
  };
}

/**
 * Escalera País → Provincia → Municipio para que una persona cargue dónde
 * vive. Cambiar un nivel limpia los de abajo (no puede quedar "Madrid,
 * Córdoba, Argentina").
 */
export function UbicacionPicker({
  value,
  onChange,
  idPrefix = "geo",
}: {
  value: GeoUbicacion | null;
  onChange: (next: GeoUbicacion | null) => void;
  idPrefix?: string;
}) {
  const country = geoCountry(value?.pais);
  const { data, error, loading } = useGeoCountry(country?.code);
  const regionNames = useMemo(() => data?.regions.map((r) => r.name) || [], [data]);
  const places = useMemo(
    () => data?.regions.find((r) => r.name === value?.provincia)?.places || [],
    [data, value?.provincia]
  );

  return (
    <div className="geo-picker">
      <div className="geo-picker-field">
        <span className="geo-picker-label">País *</span>
        <div className="geo-country-row">
          {GEO_COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              aria-pressed={value?.pais === c.code}
              className={`geo-country${value?.pais === c.code ? " is-selected" : ""}`}
              onClick={() =>
                value?.pais === c.code
                  ? undefined
                  : onChange({ pais: c.code, provincia: "", municipio: "" })
              }
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {country ? (
        <>
          <div className="geo-picker-field">
            <label className="geo-picker-label" htmlFor={`${idPrefix}-region`}>
              {country.regionLabel} *
            </label>
            <GeoCombobox
              labelFor={`${idPrefix}-region`}
              options={regionNames}
              value={value?.provincia || ""}
              display={shortRegionName}
              disabled={loading || !data}
              placeholder={loading ? "Cargando…" : `Buscá tu ${country.regionLabel.toLowerCase()}`}
              onSelect={(provincia) =>
                onChange({ pais: country.code, provincia, municipio: "" })
              }
            />
          </div>
          <div className="geo-picker-field">
            <label className="geo-picker-label" htmlFor={`${idPrefix}-place`}>
              {country.placeLabel} *
            </label>
            <GeoCombobox
              labelFor={`${idPrefix}-place`}
              options={places}
              value={value?.municipio || ""}
              disabled={!value?.provincia || places.length === 0}
              placeholder={
                value?.provincia
                  ? `Buscá tu ${country.placeLabel.split(" /")[0].toLowerCase()}`
                  : `Primero elegí ${country.regionLabel.toLowerCase()} arriba`
              }
              onSelect={(municipio) =>
                onChange({
                  pais: country.code,
                  provincia: value?.provincia || "",
                  municipio,
                })
              }
            />
          </div>
          {error ? <p className="geo-picker-error">{error}</p> : null}
        </>
      ) : null}
    </div>
  );
}

/** Pastilla quitable de una selección del filtro. */
function GeoPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="geo-pill">
      {label}
      <button type="button" aria-label={`Quitar ${label}`} onClick={onRemove}>
        ×
      </button>
    </span>
  );
}

/** Un país tildado en el filtro: sus provincias y, adentro, sus municipios. */
function GeoFilterCountry({
  country,
  selected,
  onChange,
}: {
  country: GeoCountry;
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const { data, loading, error } = useGeoCountry(country.code);
  const prefix = geoPath(country.code) + GEO_SEP;
  const chosenRegions = selected
    .filter((p) => p.startsWith(prefix) && p.split(GEO_SEP).length === 2)
    .map((p) => p.split(GEO_SEP)[1]);
  const regionOptions = (data?.regions || [])
    .map((r) => r.name)
    .filter((name) => !chosenRegions.includes(name));
  const regionWord = country.regionLabel.toLowerCase();
  const placeWord = country.placeLabel.split(" /")[0].toLowerCase();

  return (
    <div className="geo-filter-level">
      <span className="geo-filter-title">{country.name}</span>
      {chosenRegions.length ? (
        <div className="geo-pill-row">
          {chosenRegions.map((region) => (
            <GeoPill
              key={region}
              label={shortRegionName(region)}
              onRemove={() => onChange(removeGeoPath(selected, geoPath(country.code, region)))}
            />
          ))}
        </div>
      ) : (
        <p className="geo-filter-hint">Todo el país. Elegí {regionWord} para acotar.</p>
      )}
      <GeoCombobox
        inline
        clearOnSelect
        options={regionOptions}
        display={shortRegionName}
        disabled={loading || !data}
        placeholder={loading ? "Cargando…" : `+ Agregar ${regionWord}`}
        onSelect={(region) => onChange([...selected, geoPath(country.code, region)])}
      />
      {error ? <p className="geo-picker-error">{error}</p> : null}

      {chosenRegions.map((region) => {
        const regionPath = geoPath(country.code, region);
        const chosenPlaces = selected
          .filter((p) => p.startsWith(regionPath + GEO_SEP))
          .map((p) => p.split(GEO_SEP)[2]);
        const placeOptions = (
          data?.regions.find((r) => r.name === region)?.places || []
        ).filter((place) => !chosenPlaces.includes(place));
        return (
          <div key={region} className="geo-filter-level">
            <span className="geo-filter-title">{shortRegionName(region)}</span>
            {chosenPlaces.length ? (
              <div className="geo-pill-row">
                {chosenPlaces.map((place) => (
                  <GeoPill
                    key={place}
                    label={place}
                    onRemove={() =>
                      onChange(removeGeoPath(selected, geoPath(country.code, region, place)))
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="geo-filter-hint">
                Toda la {regionWord === "departamento" ? "zona" : regionWord}. Elegí {placeWord} para acotar.
              </p>
            )}
            <GeoCombobox
              inline
              clearOnSelect
              options={placeOptions}
              placeholder={`+ Agregar ${placeWord}`}
              onSelect={(place) =>
                onChange([...selected, geoPath(country.code, region, place)])
              }
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Filtro de ubicación para marcas: misma escalera que carga la persona.
 * Guarda caminos ("AR", "AR|Córdoba", "AR|Córdoba|Río Cuarto"); la regla de
 * qué perfiles entran está en `matchesGeoFilter` (manda lo más específico).
 */
export function GeoFilter({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="geo-filter">
      <div className="geo-country-row">
        {GEO_COUNTRIES.map((c) => {
          const on = selected.includes(c.code);
          return (
            <button
              key={c.code}
              type="button"
              aria-pressed={on}
              className={`geo-country${on ? " is-selected" : ""}`}
              onClick={() =>
                onChange(on ? removeGeoPath(selected, c.code) : [...selected, c.code])
              }
            >
              {c.name}
            </button>
          );
        })}
      </div>
      {GEO_COUNTRIES.filter((c) => selected.includes(c.code)).map((c) => (
        <GeoFilterCountry key={c.code} country={c} selected={selected} onChange={onChange} />
      ))}
    </div>
  );
}
