"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useConfirm } from "@/components/providers/confirm-provider";
import { AdminModuleTabs } from "@/components/admin/admin-module-tabs";

interface PermissionInfo { id: string; name: string; resource: string; action: string; }
interface RoleWithPerms {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  tenantId: string | null;
  permissions: Array<{ permission: PermissionInfo }>;
}

const SYSTEM_NAMES = ["owner", "admin", "editor", "marketing", "billing", "viewer"];

export default function RolesPage() {
  const { user } = useAuthStore();
  const { confirm } = useConfirm();
  const canManage = user?.permissions?.includes("role.manage");

  const [roles, setRoles] = useState<RoleWithPerms[]>([]);
  const [permissions, setPermissions] = useState<PermissionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<RoleWithPerms | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, PermissionInfo[]>();
    for (const p of permissions) {
      const arr = groups.get(p.resource) || [];
      arr.push(p);
      groups.set(p.resource, arr);
    }
    return Array.from(groups.entries()).map(([resource, perms]) => ({
      resource,
      perms: perms.sort((a, b) => a.action.localeCompare(b.action)),
    }));
  }, [permissions]);

  const systemRoles = roles.filter((r) => r.isSystem);
  const customRoles = roles.filter((r) => !r.isSystem);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesRes, permsRes]: any[] = await Promise.all([
        api.get("/roles"),
        api.get("/roles/permissions").catch(() => ({ data: [] })),
      ]);
      const rolesData = rolesRes.data || rolesRes;
      setRoles(Array.isArray(rolesData) ? rolesData : (rolesData.items || rolesData.data || []));
      const permsData = permsRes.data || permsRes;
      setPermissions(Array.isArray(permsData) ? permsData : (permsData.items || permsData.data || []));
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al cargar roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  const permIds = (role: RoleWithPerms) => role.permissions.map((rp) => rp.permission.id);

  const openCreate = () => {
    setEditing(null);
    setFormName("");
    setFormDesc("");
    setSelectedPerms([]);
    setShowModal(true);
  };

  const openEdit = (role: RoleWithPerms) => {
    setEditing(role);
    setFormName(role.name);
    setFormDesc(role.description || "");
    setSelectedPerms(permIds(role));
    setShowModal(true);
  };

  const togglePerm = (id: string) => {
    setSelectedPerms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const save = async () => {
    if (!formName.trim() || formName.trim().length < 2) { setError("El nombre debe tener al menos 2 caracteres"); return; }
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await api.patch(`/roles/${editing.id}`, {
          name: formName.trim(),
          description: formDesc.trim() || undefined,
        });
        await api.put(`/roles/${editing.id}/permissions`, { permissionIds: selectedPerms });
        setToast("Rol actualizado");
      } else {
        await api.post("/roles", {
          name: formName.trim(),
          description: formDesc.trim() || undefined,
          permissionIds: selectedPerms,
        });
        setToast("Rol creado");
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar el rol");
    } finally {
      setSaving(false);
    }
  };

  const removeRole = async (role: RoleWithPerms) => {
    if (!(await confirm(`¿Eliminar el rol "${role.name}"? Esta acción no se puede deshacer.`))) return;
    try {
      await api.delete(`/roles/${role.id}`);
      setToast("Rol eliminado");
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al eliminar el rol");
    }
  };

  if (loading) return <div className="p-8 flex items-center justify-center"><p className="text-slate-500">Cargando...</p></div>;

  return (
    <div className="p-8">
      <AdminModuleTabs />
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium shadow-lg">{toast}</div>}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Roles y permisos</h1>
          <p className="text-sm text-slate-600 mt-1">Configura qué puede hacer cada miembro de tu negocio.</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Crear rol
          </button>
        )}
      </div>

      {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}

      {/* Roles del sistema */}
      <div className="mb-8">
        <h3 className="font-semibold text-slate-900 mb-1">Roles del sistema</h3>
        <p className="text-sm text-slate-500 mb-4">Predefinidos por la plataforma. No se pueden modificar.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {systemRoles.map((role) => (
            <div key={role.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-900 capitalize">{role.name}</p>
                  <p className="text-xs text-slate-500">{role.description}</p>
                </div>
                <span className="text-[10px] rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 font-medium">Sistema</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {permIds(role).slice(0, 6).map((id) => {
                  const name = role.permissions.find((rp) => rp.permission.id === id)?.permission.name;
                  return <span key={id} className="text-[10px] font-mono rounded bg-slate-50 border border-slate-200 px-1.5 py-0.5 text-slate-600">{name}</span>;
                })}
                {permIds(role).length > 6 && <span className="text-[10px] rounded bg-slate-50 border border-slate-200 px-1.5 py-0.5 text-slate-400">+{permIds(role).length - 6}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Roles personalizados */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-1">Roles personalizados</h3>
        <p className="text-sm text-slate-500 mb-4">Creados por ti para tu negocio. Aparecen al invitar usuarios y asignar roles.</p>
        {customRoles.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <p className="text-sm text-slate-500 mb-1">Aún no tienes roles personalizados.</p>
            {canManage && <p className="text-sm text-slate-400">Crea un rol como Redactor y elige sus permisos.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {customRoles.map((role) => (
              <div key={role.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-900">{role.name}</p>
                    <p className="text-xs text-slate-500">{role.description || "Sin descripción"}</p>
                  </div>
                  <span className="text-[10px] rounded-full bg-primary-50 text-primary-700 px-2 py-0.5 font-medium">{permIds(role).length} permisos</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-3 flex-1">
                  {permIds(role).slice(0, 6).map((id) => {
                    const name = role.permissions.find((rp) => rp.permission.id === id)?.permission.name;
                    return <span key={id} className="text-[10px] font-mono rounded bg-slate-50 border border-slate-200 px-1.5 py-0.5 text-slate-600">{name}</span>;
                  })}
                  {permIds(role).length > 6 && <span className="text-[10px] rounded bg-slate-50 border border-slate-200 px-1.5 py-0.5 text-slate-400">+{permIds(role).length - 6}</span>}
                </div>
                {canManage && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    <button onClick={() => openEdit(role)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Editar</button>
                    <button onClick={() => removeRole(role)} className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors">Eliminar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">{editing ? `Editar rol "${editing.name}"` : "Crear rol personalizado"}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto">
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre del rol</label>
                  <input className="input-field" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="p. ej. Redactor" maxLength={50} />
                </div>
                <div className="flex-[2]">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción</label>
                  <input className="input-field" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Breve descripción" maxLength={200} />
                </div>
              </div>

              <label className="block text-sm font-medium text-slate-700 mb-2">Permisos</label>
              {groupedPermissions.length === 0 ? (
                <p className="text-sm text-slate-500">No hay permisos disponibles.</p>
              ) : (
                <div className="space-y-3">
                  {groupedPermissions.map(({ resource, perms }) => (
                    <div key={resource}>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{resource}</p>
                      <div className="flex flex-wrap gap-2">
                        {perms.map((p) => {
                          const active = selectedPerms.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => togglePerm(p.id)}
                              className={`rounded-lg px-2.5 py-1.5 text-xs font-mono border transition-all ${active ? "bg-primary-50 text-primary-700 border-primary-300" : "bg-white text-slate-500 border-slate-200 hover:border-primary-200"}`}
                            >
                              {p.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
              {error && <p className="text-xs text-red-600 flex-1">{error}</p>}
              <button onClick={() => setShowModal(false)} className="btn-ghost text-sm whitespace-nowrap">Cancelar</button>
              <button onClick={save} disabled={saving} className="btn-primary text-sm whitespace-nowrap">{saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear rol"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}