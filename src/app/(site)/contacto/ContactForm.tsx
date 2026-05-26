"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

const SUBJECTS = [
  "Consulta sobre productos",
  "Consulta sobre envíos",
  "Soporte técnico",
  "Mayoristas",
  "Otro",
] as const;

type FormData = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const EMPTY: FormData = { name: "", email: "", phone: "", subject: "", message: "" };

export default function ContactForm() {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");

  function validate(): boolean {
    const e: Partial<FormData> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Nombre requerido (mín. 2 caracteres)";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Email inválido";
    if (!form.subject) e.subject = "Seleccioná un asunto";
    if (!form.message.trim() || form.message.trim().length < 10) e.message = "Mensaje requerido (mín. 10 caracteres)";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) setErrors(prev => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, phone: form.phone || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setServerError(data.error ?? "Error al enviar"); return; }
      setSent(true);
    } catch {
      setServerError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bio-green/10">
          <CheckCircle2 size={36} className="text-bio-green" />
        </div>
        <h3 className="text-xl font-bold text-bio-dark">¡Mensaje enviado!</h3>
        <p className="max-w-sm text-bio-dark/70">
          Gracias por contactarnos. Te responderemos a <strong>{form.email}</strong> a la brevedad.
        </p>
        <button
          onClick={() => { setSent(false); setForm(EMPTY); }}
          className="mt-2 text-sm font-medium text-bio-green underline underline-offset-2 hover:opacity-80"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Nombre */}
      <div>
        <label className="mb-1 block text-sm font-medium text-bio-dark">
          Nombre completo <span className="text-bio-orange">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Juan García"
          autoComplete="name"
          className={`w-full rounded-xl border px-4 py-2.5 text-sm text-bio-dark outline-none transition-colors focus:border-bio-green ${
            errors.name ? "border-red-400 bg-red-50" : "border-bio-dark/20 bg-white hover:border-bio-green/50"
          }`}
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>

      {/* Email + Teléfono */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-bio-dark">
            Email <span className="text-bio-orange">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="juan@email.com"
            autoComplete="email"
            className={`w-full rounded-xl border px-4 py-2.5 text-sm text-bio-dark outline-none transition-colors focus:border-bio-green ${
              errors.email ? "border-red-400 bg-red-50" : "border-bio-dark/20 bg-white hover:border-bio-green/50"
            }`}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-bio-dark">
            Teléfono <span className="text-bio-dark/40 text-xs font-normal">(opcional)</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+54 9 11 1234-5678"
            autoComplete="tel"
            className="w-full rounded-xl border border-bio-dark/20 bg-white px-4 py-2.5 text-sm text-bio-dark outline-none transition-colors hover:border-bio-green/50 focus:border-bio-green"
          />
        </div>
      </div>

      {/* Asunto */}
      <div>
        <label className="mb-1 block text-sm font-medium text-bio-dark">
          Asunto <span className="text-bio-orange">*</span>
        </label>
        <select
          name="subject"
          value={form.subject}
          onChange={handleChange}
          className={`w-full rounded-xl border px-4 py-2.5 text-sm text-bio-dark outline-none transition-colors focus:border-bio-green ${
            errors.subject ? "border-red-400 bg-red-50" : "border-bio-dark/20 bg-white hover:border-bio-green/50"
          }`}
        >
          <option value="">Seleccioná un asunto…</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
      </div>

      {/* Mensaje */}
      <div>
        <label className="mb-1 block text-sm font-medium text-bio-dark">
          Mensaje <span className="text-bio-orange">*</span>
        </label>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          rows={5}
          placeholder="Escribí tu consulta aquí…"
          className={`w-full resize-none rounded-xl border px-4 py-2.5 text-sm text-bio-dark outline-none transition-colors focus:border-bio-green ${
            errors.message ? "border-red-400 bg-red-50" : "border-bio-dark/20 bg-white hover:border-bio-green/50"
          }`}
        />
        <div className="flex items-center justify-between">
          {errors.message
            ? <p className="mt-1 text-xs text-red-500">{errors.message}</p>
            : <span />}
          <p className="mt-1 text-xs text-bio-dark/40">{form.message.length}/2000</p>
        </div>
      </div>

      {serverError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-bio-green px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading
          ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Enviando…</>
          : <><Send size={16} /> Enviar mensaje</>}
      </button>
    </form>
  );
}
