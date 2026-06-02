"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Link2,
  Check,
  Mail,
  Cpu,
  X,
  Users,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

type EquipoMini = {
  id: string;
  deviceId: string;
  nombre: string | null;
  activo: boolean;
};

type Cliente = {
  id: string;
  nombre: string;
  email: string | null;
  telegramChatId: string | null;
  accessToken: string | null;
  notas: string | null;
  equipos: EquipoMini[];
};

export default function ClientesAdminPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/clientes")
      .then((r) => r.json())
      .then((d) => {
        setClientes(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }

  useEffect(load, []);

  function copyLink(id: string, token: string) {
    const url = `${window.location.origin}/cliente/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      toast.success("Link copiado");
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1800);
    });
  }

  async function deleteCliente(c: Cliente) {
    if (
      !confirm(
        `¿Eliminar al cliente "${c.nombre}"?` +
          (c.equipos.length
            ? `\nSus ${c.equipos.length} equipo(s) quedarán sin asignar (no se borran).`
            : ""),
      )
    )
      return;
    const res = await fetch(`/api/admin/clientes/${c.id}`, { method: "DELETE" });
    if (res.ok) {
      setClientes((prev) => prev.filter((x) => x.id !== c.id));
      toast.success("Cliente eliminado");
    } else {
      toast.error("No se pudo eliminar");
    }
  }

  return (
    <div className="space-y-5">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Clientes</h1>
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 rounded-lg bg-bio-green px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus size={16} /> Nuevo cliente
        </button>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-bio-green border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Contacto</th>
                <th className="px-4 py-3 text-center">Equipos</th>
                <th className="px-4 py-3 text-left">Link de acceso</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {clientes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/clientes/${c.id}`}
                      className="font-medium text-slate-700 hover:text-bio-green"
                    >
                      {c.nombre}
                    </Link>
                    {c.notas && (
                      <p className="max-w-[16rem] truncate text-xs text-slate-400">
                        {c.notas}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.email ? (
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <Mail size={13} className="text-slate-400" />
                        {c.email}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                      <Cpu size={12} />
                      {c.equipos.length}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.accessToken ? (
                      <button
                        type="button"
                        onClick={() => copyLink(c.id, c.accessToken!)}
                        title="Copiar link de acceso del cliente"
                        className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                          copiedId === c.id
                            ? "bg-emerald-100 text-emerald-700"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        }`}
                      >
                        {copiedId === c.id ? <Check size={13} /> : <Link2 size={13} />}
                        {copiedId === c.id ? "Copiado" : "Copiar link"}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-300">sin link</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/clientes/${c.id}`}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        title="Gestionar"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => deleteCliente(c)}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clientes.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-400">
              <Users size={28} className="text-slate-300" />
              <p className="text-sm">Sin clientes aún.</p>
            </div>
          )}
        </div>
      )}

      {showNew && (
        <NewClienteModal
          onClose={() => setShowNew(false)}
          onCreated={(c) => {
            setClientes((prev) =>
              [...prev, c].sort((a, b) => a.nombre.localeCompare(b.nombre)),
            );
            setShowNew(false);
            toast.success("Cliente creado");
          }}
        />
      )}
    </div>
  );
}

function NewClienteModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (c: Cliente) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email, telegramChatId, notas }),
    });
    setSaving(false);
    if (res.ok) {
      onCreated(await res.json());
    } else {
      const d = await res.json().catch(() => null);
      toast.error(
        typeof d?.error === "string" ? d.error : "No se pudo crear el cliente",
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Nuevo cliente</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <Field label="Nombre *">
            <input
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="input"
              placeholder="Distribuidora Norte"
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
          <Field label="Telegram Chat ID (opcional)">
            <input
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              className="input"
              placeholder="Para alertas (F3)"
            />
          </Field>
          <Field label="Notas (opcional)">
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              className="input resize-none"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-bio-green px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Creando…" : "Crear cliente"}
            </button>
          </div>
        </form>
      </div>

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
