"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Package, CheckCircle, XCircle } from "lucide-react";

type Supplier = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  paymentTerms: string | null;
  active: boolean;
  _count: { products: number; supplierOrders: number };
};

export default function ProveedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/suppliers");
    if (res.ok) setSuppliers(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar proveedor "${name}"? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/admin/suppliers/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    } else {
      const { error } = await res.json();
      alert(error ?? "Error al eliminar");
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Proveedores</h1>
          <p className="mt-1 text-sm text-slate-500">Gestión de proveedores de dropshipping</p>
        </div>
        <Link
          href="/admin/proveedores/nuevo"
          className="flex items-center gap-2 rounded-lg bg-bio-green px-4 py-2 text-sm font-semibold text-white hover:bg-bio-green/90"
        >
          <Plus size={16} />
          Nuevo proveedor
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-slate-400">Cargando...</div>
      ) : suppliers.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
          <Package size={36} className="mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-500">No hay proveedores todavía</p>
          <Link href="/admin/proveedores/nuevo" className="mt-3 inline-flex items-center gap-1.5 text-sm text-bio-green hover:underline">
            <Plus size={14} /> Agregar el primero
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Proveedor</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Cond. de pago</th>
                <th className="px-4 py-3 text-center">Productos</th>
                <th className="px-4 py-3 text-center">Órdenes</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{s.name}</p>
                    {s.phone && <p className="text-xs text-slate-400">{s.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.email}</td>
                  <td className="px-4 py-3 text-slate-500">{s.paymentTerms ?? "—"}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{s._count.products}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{s._count.supplierOrders}</td>
                  <td className="px-4 py-3 text-center">
                    {s.active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        <CheckCircle size={11} /> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        <XCircle size={11} /> Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <Link
                        href={`/admin/proveedores/${s.id}`}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id, s.name)}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
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
        </div>
      )}
    </div>
  );
}
