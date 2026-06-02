"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Link2,
  Check,
  RefreshCw,
  Cpu,
  Plus,
  X,
  Wifi,
  WifiOff,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

type Equipo = {
  id: string;
  deviceId: string;
  nombre: string | null;
  modelo: string | null;
  activo: boolean;
  online: boolean;
  lastSeenAt: string | null;
};

type Cliente = {
  id: string;
  nombre: string;
  email: string | null;
  telegramChatId: string | null;
  accessToken: string | null;
  notas: string | null;
  equipos: Equipo[];
};

type EquipoDisponible = { id: string; deviceId: string; nombre: string | null };

export default function ClienteDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [disponibles, setDisponibles] = useState<EquipoDisponible[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  const [copied, setCopied] = useState(false);
  const [assignSel, setAssignSel] = useState("");

  const load = useCallback(() => {
    if (!id) return;
    fetch(`/api/admin/clientes/${id}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        const c: Cliente = d.cliente;
        setCliente(c);
        setDisponibles(d.equiposDisponibles ?? []);
        setNombre(c.nombre);
        setEmail(c.email ?? "");
        setTelegramChatId(c.telegramChatId ?? "");
        setNotas(c.notas ?? "");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  async function save() {
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/admin/clientes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email, telegramChatId, notas }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Cambios guardados");
      setCliente((c) => (c ? { ...c, nombre, email, telegramChatId, notas } : c));
    } else {
      const d = await res.json().catch(() => null);
      toast.error(typeof d?.error === "string" ? d.error : "No se pudo guardar");
    }
  }

  function copyLink() {
    if (!cliente?.accessToken) return;
    const url = `${window.location.origin}/cliente/${cliente.accessToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success("Link copiado");
      setTimeout(() => setCopied(false), 1800);
    });
  }

  async function regenerateToken() {
    if (
      !confirm(
        "¿Generar un link nuevo? El link anterior dejará de funcionar de inmediato.",
      )
    )
      return;
    const res = await fetch(`/api/admin/clientes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regenerateToken: true }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCliente((c) => (c ? { ...c, accessToken: updated.accessToken } : c));
      toast.success("Link regenerado");
    } else {
      toast.error("No se pudo regenerar");
    }
  }

  async function assign() {
    if (!assignSel) return;
    const res = await fetch(`/api/admin/clientes/${id}/equipos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipoId: assignSel }),
    });
    if (res.ok) {
      setAssignSel("");
      toast.success("Equipo asignado");
      load();
    } else {
      toast.error("No se pudo asignar");
    }
  }

  async function unassign(equipoId: string) {
    const res = await fetch(`/api/admin/clientes/${id}/equipos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipoId }),
    });
    if (res.ok) {
      toast.success("Equipo quitado");
      load();
    } else {
      toast.error("No se pudo quitar");
    }
  }

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-bio-green border-t-transparent" />
      </div>
    );
  }

  if (notFound || !cliente) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
          Cliente no encontrado.
        </p>
      </div>
    );
  }

  const linkUrl = cliente.accessToken
    ? `/cliente/${cliente.accessToken}`
    : null;

  return (
    <div className="space-y-5">
      <Toaster position="top-right" />
      <BackLink />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">{cliente.nombre}</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Datos del cliente */}
        <section className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Datos</h2>
          <Field label="Nombre *">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="cliente@mail.com"
            />
          </Field>
          <Field label="Telegram Chat ID">
            <input
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              className="input"
              placeholder="Para alertas (F3)"
            />
          </Field>
          <Field label="Notas">
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              className="input resize-none"
            />
          </Field>
          <div className="pt-1">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-bio-green px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              <Save size={15} />
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </section>

        {/* Link de acceso */}
        <section className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Link de acceso</h2>
          <p className="text-xs text-slate-500">
            Compartí este link privado con el cliente. No requiere clave: el token
            es la credencial. No lo indexa Google.
          </p>
          {linkUrl ? (
            <>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <Link2 size={14} className="shrink-0 text-slate-400" />
                <code className="flex-1 truncate text-xs text-slate-600">
                  {linkUrl}
                </code>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyLink}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    copied
                      ? "bg-emerald-100 text-emerald-700"
                      : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {copied ? <Check size={15} /> : <Link2 size={15} />}
                  {copied ? "Copiado" : "Copiar link completo"}
                </button>
                <Link
                  href={linkUrl}
                  target="_blank"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Abrir
                </Link>
                <button
                  type="button"
                  onClick={regenerateToken}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-amber-50 hover:text-amber-700"
                >
                  <RefreshCw size={15} />
                  Regenerar
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={regenerateToken}
              className="flex items-center gap-1.5 rounded-lg bg-bio-green px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              <Link2 size={15} /> Generar link de acceso
            </button>
          )}
        </section>
      </div>

      {/* Equipos */}
      <section className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            Equipos asignados ({cliente.equipos.length})
          </h2>
        </div>

        {cliente.equipos.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">
            Este cliente todavía no tiene equipos.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {cliente.equipos.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      e.online
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-slate-100 text-slate-400"
                    }`}
                    title={e.online ? "En línea" : "Offline"}
                  >
                    {e.online ? <Wifi size={15} /> : <WifiOff size={15} />}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {e.nombre ?? e.deviceId}
                    </p>
                    <p className="font-mono text-xs text-slate-400">
                      {e.deviceId}
                      {e.modelo ? ` · ${e.modelo}` : ""}
                      {!e.activo ? " · inactivo" : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => unassign(e.id)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-400 hover:bg-red-50 hover:text-red-600"
                  title="Quitar de este cliente"
                >
                  <X size={14} /> Quitar
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Asignar equipo */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <Cpu size={15} className="text-slate-400" />
          {disponibles.length === 0 ? (
            <span className="text-xs text-slate-400">
              No hay equipos libres para asignar.
            </span>
          ) : (
            <>
              <select
                value={assignSel}
                onChange={(e) => setAssignSel(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 outline-none focus:border-bio-green"
              >
                <option value="">Asignar equipo libre…</option>
                {disponibles.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.deviceId}
                    {d.nombre ? ` — ${d.nombre}` : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={assign}
                disabled={!assignSel}
                className="flex items-center gap-1.5 rounded-lg bg-bio-green px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
              >
                <Plus size={15} /> Asignar
              </button>
            </>
          )}
        </div>
      </section>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(203 213 225);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: rgb(51 65 85);
          outline: none;
        }
        :global(.input:focus) {
          border-color: #4a7c59;
          box-shadow: 0 0 0 1px #4a7c59;
        }
      `}</style>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/clientes"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
    >
      <ArrowLeft size={15} /> Volver a clientes
    </Link>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}
