'use client';

import { useState } from 'react';
import type { Banner } from '@/types/banner';
import { EMPTY_BANNER } from '@/types/banner';
import BannerCarousel from '@/components/BannerCarousel';
import styles from './BannerForm.module.css';

type Props = {
  banner?: Banner;
  onSaved?: (banner: Banner) => void;
};

export default function BannerForm({ banner, onSaved }: Props) {
  const [form, setForm] = useState<Omit<Banner, 'id'>>(banner ?? EMPTY_BANNER);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function uploadImage(file: File, field: 'imageUrl' | 'imageUrlMobile') {
    const body = new FormData();
    body.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body });
    const { url } = await res.json();
    set(field, url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors([]);
    const res = await fetch(banner ? `/api/admin/banners/${banner.id}` : '/api/admin/banners', {
      method: banner ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.status === 422) {
      setErrors((await res.json()).errors);
      return;
    }
    if (!res.ok) {
      setErrors(['No se pudo guardar. Intentá de nuevo.']);
      return;
    }
    onSaved?.(await res.json());
  }

  return (
    <div className={styles.layout}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.h2}>{banner ? 'Editar banner' : 'Nuevo banner'}</h2>

        {errors.length > 0 && (
          <ul className={styles.errors} role="alert">
            {errors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        )}

        <fieldset className={styles.group}>
          <legend>Imagen</legend>

          <label className={styles.field}>
            <span>Imagen desktop <em>· 1200 × 500 px</em></span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'imageUrl')}
            />
            <input
              type="url"
              placeholder="…o pegá una URL"
              value={form.imageUrl}
              onChange={(e) => set('imageUrl', e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span>Imagen mobile <em>· opcional, 800 × 800 px</em></span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'imageUrlMobile')}
            />
          </label>

          <label className={styles.field}>
            <span>Texto alternativo <em>· obligatorio</em></span>
            <input
              type="text"
              required
              value={form.alt}
              onChange={(e) => set('alt', e.target.value)}
              placeholder="Ej: Bandeja deshidratadora de acero inoxidable"
            />
          </label>
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Textos</legend>

          <label className={styles.field}>
            <span>Volanta <em>· opcional</em></span>
            <input type="text" maxLength={40} value={form.eyebrow ?? ''} onChange={(e) => set('eyebrow', e.target.value)} />
          </label>

          <label className={styles.field}>
            <span>Título <em>· hasta 80 caracteres</em></span>
            <input type="text" maxLength={80} value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} />
            <small>{(form.title ?? '').length}/80</small>
          </label>

          <label className={styles.field}>
            <span>Bajada <em>· hasta 160 caracteres</em></span>
            <textarea rows={3} maxLength={160} value={form.subtitle ?? ''} onChange={(e) => set('subtitle', e.target.value)} />
            <small>{(form.subtitle ?? '').length}/160</small>
          </label>
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Link</legend>

          <label className={styles.field}>
            <span>Texto del botón</span>
            <input type="text" maxLength={24} value={form.ctaLabel ?? ''} onChange={(e) => set('ctaLabel', e.target.value)} placeholder="Ver productos" />
          </label>

          <label className={styles.field}>
            <span>Destino</span>
            <input type="text" value={form.ctaHref ?? ''} onChange={(e) => set('ctaHref', e.target.value)} placeholder="/productos o https://..." />
          </label>

          <label className={styles.checkbox}>
            <input type="checkbox" checked={form.ctaNewTab ?? false} onChange={(e) => set('ctaNewTab', e.target.checked)} />
            Abrir en una pestaña nueva
          </label>

          <label className={styles.field}>
            <span>Link de todo el banner <em>· se usa si no hay botón</em></span>
            <input type="text" value={form.href ?? ''} onChange={(e) => set('href', e.target.value)} placeholder="/ofertas" />
          </label>
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Presentación</legend>

          <label className={styles.field}>
            <span>Alineación del texto</span>
            <select value={form.align} onChange={(e) => set('align', e.target.value as Banner['align'])}>
              <option value="left">Izquierda</option>
              <option value="center">Centro</option>
              <option value="right">Derecha</option>
            </select>
          </label>

          <label className={styles.field}>
            <span>Color del texto</span>
            <select value={form.theme} onChange={(e) => set('theme', e.target.value as Banner['theme'])}>
              <option value="dark">Claro (sobre imagen oscura)</option>
              <option value="light">Oscuro (sobre imagen clara)</option>
            </select>
          </label>

          <label className={styles.field}>
            <span>Oscurecer imagen <em>· {Math.round(form.overlay * 100)}%</em></span>
            <input type="range" min={0} max={1} step={0.05} value={form.overlay} onChange={(e) => set('overlay', Number(e.target.value))} />
          </label>
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Publicación</legend>

          <label className={styles.checkbox}>
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
            Activo
          </label>

          <label className={styles.field}>
            <span>Orden</span>
            <input type="number" value={form.order} onChange={(e) => set('order', Number(e.target.value))} />
          </label>

          <div className={styles.row}>
            <label className={styles.field}>
              <span>Publicar desde</span>
              <input type="datetime-local" value={form.startsAt ?? ''} onChange={(e) => set('startsAt', e.target.value || null)} />
            </label>
            <label className={styles.field}>
              <span>Hasta</span>
              <input type="datetime-local" value={form.endsAt ?? ''} onChange={(e) => set('endsAt', e.target.value || null)} />
            </label>
          </div>
        </fieldset>

        <button className={styles.submit} type="submit" disabled={saving}>
          {saving ? 'Guardando…' : banner ? 'Guardar cambios' : 'Crear banner'}
        </button>
      </form>

      <aside className={styles.preview}>
        <h3 className={styles.h3}>Vista previa</h3>
        {form.imageUrl ? (
          <BannerCarousel banners={[{ ...form, id: 'preview' }]} interval={0} />
        ) : (
          <p className={styles.empty}>Subí una imagen de 1200 × 500 px para ver la vista previa.</p>
        )}
      </aside>
    </div>
  );
}
