"use client";

import { useEffect, useState } from "react";
import { Mail, MailOpen, CheckCheck, Trash2, MessageSquare } from "lucide-react";

type Message = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
};

const STATUS_LABELS: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
  unread:  { label: "No leído",   cls: "bg-blue-100 text-blue-700",    Icon: Mail },
  read:    { label: "Leído",      cls: "bg-slate-100 text-slate-500",   Icon: MailOpen },
  replied: { label: "Respondido", cls: "bg-green-100 text-green-700",   Icon: CheckCheck },
};

export default function AdminContactoPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/contact");
    const data = await res.json();
    setMessages(data.messages ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function openMessage(msg: Message) {
    const res = await fetch(`/api/admin/contact/${msg.id}`);
    const data = await res.json();
    setSelected(data);
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: data.status } : m));
  }

  async function setStatus(id: string, status: string) {
    await fetch(`/api/admin/contact/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  }

  async function deleteMessage(id: string) {
    if (!confirm("¿Eliminar este mensaje?")) return;
    await fetch(`/api/admin/contact/${id}`, { method: "DELETE" });
    setMessages(prev => prev.filter(m => m.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-bio-green border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Mensajes de contacto</h1>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
          {messages.filter(m => m.status === "unread").length} sin leer
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Lista */}
        <div className="rounded-xl bg-white shadow-sm overflow-hidden">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <MessageSquare size={32} className="text-slate-300" />
              <p className="text-sm text-slate-400">No hay mensajes aún</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {messages.map(msg => {
                const st = STATUS_LABELS[msg.status] ?? STATUS_LABELS.read;
                return (
                  <li key={msg.id}>
                    <button
                      onClick={() => openMessage(msg)}
                      className={`w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 ${selected?.id === msg.id ? "bg-slate-50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${st.cls}`}>
                          <st.Icon size={11} />
                          {st.label}
                        </span>
                        <span className="text-xs text-slate-400 shrink-0">
                          {new Date(msg.createdAt).toLocaleDateString("es-AR")}
                        </span>
                      </div>
                      <p className={`mt-1 text-sm ${msg.status === "unread" ? "font-semibold text-slate-800" : "text-slate-700"}`}>
                        {msg.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{msg.subject}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Detalle */}
        {selected ? (
          <div className="rounded-xl bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">{selected.subject}</h2>
                <p className="text-sm text-slate-500">
                  {selected.name} · <a href={`mailto:${selected.email}`} className="text-bio-green hover:underline">{selected.email}</a>
                  {selected.phone && ` · ${selected.phone}`}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(selected.createdAt).toLocaleString("es-AR")}
                </p>
              </div>
              <button
                onClick={() => deleteMessage(selected.id)}
                className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="whitespace-pre-wrap text-sm text-slate-700">{selected.message}</p>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <span className="text-sm font-medium text-slate-600 self-center">Estado:</span>
              {(["unread", "read", "replied"] as const).map(s => {
                const st = STATUS_LABELS[s];
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(selected.id, s)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      selected.status === s
                        ? st.cls + " ring-2 ring-offset-1 ring-current"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    <st.Icon size={12} />
                    {st.label}
                  </button>
                );
              })}

              <a
                href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                onClick={() => setStatus(selected.id, "replied")}
                className="ml-auto flex items-center gap-1.5 rounded-lg bg-bio-green px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Mail size={12} />
                Responder por email
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-white py-16 shadow-sm text-center">
            <MailOpen size={40} className="text-slate-200" />
            <p className="text-slate-400 text-sm">Seleccioná un mensaje para verlo</p>
          </div>
        )}
      </div>
    </div>
  );
}
