"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useConfirm } from "@/components/providers/confirm-provider";

interface UserTenantInfo { id: string; tenant: { id: string; name: string }; roles: Array<{ role: { id: string; name: string } }>; }
interface User { id: string; email: string; firstName: string; lastName: string; isActive: boolean; isVerified: boolean; lastLoginAt: string; lastLoginIp: string; createdAt: string; updatedAt: string; userTenants: UserTenantInfo[]; }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { confirm } = useConfirm();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [showConfirm, setShowConfirm] = useState<{ id: string; name: string; action: string } | null>(null);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [tenants, setTenants] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [assignTenantId, setAssignTenantId] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const params: any = {};
      if (roleFilter) params.role = roleFilter;
      const res: any = await api.get("/users/admin/all", { params });
      setUsers(res.data || res);
    }
    catch {} finally { setLoading(false); }
  }, [roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    let list = users;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u) => 
        u.firstName?.toLowerCase().includes(q) || 
        u.lastName?.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q)
      );
    }
    if (statusFilter === "active") list = list.filter((u) => u.isActive);
    if (statusFilter === "blocked") list = list.filter((u) => !u.isActive);
    if (statusFilter === "verified") list = list.filter((u) => u.isVerified);
    setFiltered(list);
  }, [search, statusFilter, users]);

  const confirmAction = async () => {
    if (!showConfirm) return;
    try {
      await api.put(`/users/admin/${showConfirm.id}/toggle-block`);
      setShowConfirm(null); setSelected(null); fetchUsers();
    } catch (err: any) { alert(err.response?.data?.message || "Error"); }
  };

  const fetchRoles = async () => {
    try { const res: any = await api.get("/roles"); setRoles((res.data || res).filter((r: any) => r.name !== "super_admin" && r.name !== "support")); }
    catch {}
  };

  const fetchTenants = async () => {
    try { const res: any = await api.get("/tenants/admin/all"); setTenants(res.data || res); }
    catch {}
  };

  const assignTenant = async () => {
    if (!assignTenantId || !selected) return;
    setRoleLoading(true);
    try {
      const ownerRole = roles.find((r) => r.name === "owner");
      if (!ownerRole?.id) {
        alert("No se encontró el rol 'owner' para asignar al usuario.");
        return;
      }
      await api.post("/users/admin/assign-tenant", { userId: selected.id, tenantId: assignTenantId, roleId: ownerRole?.id });
      setAssignTenantId(""); fetchUsers();
    } catch (err: any) { alert(err.response?.data?.message || "Error"); }
    finally { setRoleLoading(false); }
  };

  const removeTenant = async (userId: string, tenantId: string, tenantName: string) => {
    if (!(await confirm(`¿Remover al usuario del negocio "${tenantName}"?`))) return;
    try { await api.delete(`/users/admin/${userId}/tenant/${tenantId}`); fetchUsers(); }
    catch (err: any) { alert(err.response?.data?.message || "Error"); }
  };

  const changeRole = async (userTenantId: string, roleId: string, currentRoles: any[]) => {
    setRoleLoading(true);
    try {
      const hasRole = currentRoles.some((r: any) => r.id === roleId || r.role?.id === roleId);
      if (hasRole) {
        await api.delete(`/roles/remove/${userTenantId}/${roleId}`);
      } else {
        await api.post("/roles/assign", { userTenantId, roleId });
      }
      fetchUsers();
    } catch {} finally { setRoleLoading(false); }
  };

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    blocked: users.filter((u) => !u.isActive).length,
    verified: users.filter((u) => u.isVerified).length,
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-primary-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-slate-500">Cargando usuarios...</p>
        </div>
      </div>
);
  }

  const roleLabel = (roles: string[]) => {
    const map: Record<string, string> = { super_admin: "Super Admin", owner: "Owner", admin: "Admin", editor: "Editor", marketing: "Marketing", billing: "Billing", viewer: "Viewer", support: "Soporte" };
    return roles.map((r) => map[r] || r).join(", ");
  };

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
        <p className="text-sm text-slate-500 mt-1">Administración de todos los usuarios de la plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: stats.total, color: "text-primary-700" },
          { label: "Activos", value: stats.active, color: "text-green-700" },
          { label: "Bloqueados", value: stats.blocked, color: "text-red-700" },
          { label: "Verificados", value: stats.verified, color: "text-purple-700" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" placeholder="Buscar por nombre o email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["", "active", "blocked", "verified"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2.5 text-xs font-medium rounded-xl border transition-all ${
              statusFilter === s ? "bg-primary-50 text-primary-700 border-primary-200" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}>
              {s === "" ? "Todos" : s === "active" ? "Activos" : s === "blocked" ? "Bloqueados" : "Verificados"}
            </button>
          ))}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
          >
            <option value="">Todos los roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="support">Soporte</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="marketing">Marketing</option>
            <option value="billing">Billing</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuario</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Roles</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Último acceso</th>
                <th className="text-center py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="text-center py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center"><p className="text-slate-400 text-sm">No se encontraron usuarios</p></td></tr>
              ) : (
                filtered.map((u) => {
                  const allRoles = [...new Set(u.userTenants?.flatMap((ut) => ut.roles.map((r) => r.role.name)) || [])];
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-3 px-4">
                        <button onClick={() => { setSelected(u); fetchRoles(); fetchTenants(); }} className="text-left hover:text-primary-600 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-sm flex-shrink-0">
                              {(u.firstName?.[0] || "") + (u.lastName?.[0] || "") || u.email[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{u.firstName} {u.lastName}</p>
                              <p className="text-xs text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </button>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {allRoles.length === 0 ? (
                            <span className="text-xs text-slate-400">Sin roles</span>
                          ) : (
                            allRoles.map((r) => (
                              <span key={r} className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                r === "super_admin" ? "bg-purple-50 text-purple-700" :
                                r === "owner" ? "bg-blue-50 text-blue-700" :
                                r === "admin" ? "bg-amber-50 text-amber-700" :
                                r === "support" ? "bg-teal-50 text-teal-700" :
                                "bg-slate-50 text-slate-600"
                              }`}>{r}</span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <div className="text-xs">
                          {u.lastLoginAt ? (
                            <>
                              <p className="text-slate-600">{formatDate(u.lastLoginAt)}</p>
                              {u.lastLoginIp && <p className="text-slate-400 mt-0.5">{u.lastLoginIp}</p>}
                            </>
                          ) : <span className="text-slate-400">Nunca</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            u.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          }`}>
                            <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1 ${u.isActive ? "bg-green-500" : "bg-red-500"}`} />
                            {u.isActive ? "Activo" : "Bloqueado"}
                          </span>
                          {u.isVerified && <span className="rounded-full bg-blue-50 text-blue-600 px-2 py-0.5 text-xs font-medium">✓</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setShowConfirm({ id: u.id, name: `${u.firstName} ${u.lastName}`, action: u.isActive ? "block" : "unblock" })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            u.isActive
                              ? "text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200"
                              : "text-green-600 hover:text-green-700 hover:bg-green-50 border border-green-200"
                          }`}
                        >
                          {u.isActive ? "Bloquear" : "Desbloquear"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl overflow-y-auto animate-slide-left">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 truncate">{selected.firstName} {selected.lastName}</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl">
                  {(selected.firstName?.[0] || "") + (selected.lastName?.[0] || "") || "?"}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{selected.firstName} {selected.lastName}</p>
                  <p className="text-sm text-slate-500">{selected.email}</p>
                  <div className="flex gap-2 mt-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${selected.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{selected.isActive ? "Activo" : "Bloqueado"}</span>
                    {selected.isVerified && <span className="rounded-full bg-blue-50 text-blue-600 px-2 py-0.5 text-xs font-medium">Verificado</span>}
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-2">Información</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">ID</span><span className="font-mono text-xs text-slate-400">{selected.id}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Registro</span><span className="text-slate-700">{formatDate(selected.createdAt)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Último acceso</span><span className="text-slate-700">{selected.lastLoginAt ? formatDate(selected.lastLoginAt) : "Nunca"}</span></div>
                  {selected.lastLoginIp && <div className="flex justify-between"><span className="text-slate-500">IP</span><span className="font-mono text-xs text-slate-400">{selected.lastLoginIp}</span></div>}
                </div>
              </div>

                {selected.userTenants && selected.userTenants.length > 0 && (
                  <>
                    <hr className="border-slate-100" />
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase mb-2">Negocios ({selected.userTenants.length})</p>
                      <div className="space-y-3">
                        {selected.userTenants.map((ut, i) => (
                          <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-slate-800">{ut.tenant.name}</p>
                              <button onClick={() => removeTenant(selected.id, ut.tenant.id, ut.tenant.name)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {roles.map((role) => {
                                const hasRole = ut.roles.some((r) => r.role.id === role.id);
                                return (
                                  <button
                                    key={role.id}
                                    onClick={() => changeRole(ut.id, role.id, ut.roles)}
                                    disabled={roleLoading}
                                    className={`rounded-full px-2.5 py-1 text-xs border transition-all ${hasRole ? "bg-primary-50 text-primary-700 border-primary-200 font-medium" : "bg-white text-slate-400 border-slate-200 hover:border-primary-200"}`}
                                  >
                                    {role.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

              <hr className="border-slate-100" />

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-2">Asignar a un negocio</p>
                <div className="flex gap-2">
                  <select value={assignTenantId} onChange={(e) => setAssignTenantId(e.target.value)}
                    className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                    <option value="">Seleccionar tenant...</option>
                    {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <button onClick={assignTenant} disabled={!assignTenantId || roleLoading}
                    className="btn-primary text-xs whitespace-nowrap">Asignar</button>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-3">Acciones</p>
                <button
                  onClick={() => { setShowConfirm({ id: selected.id, name: `${selected.firstName} ${selected.lastName}`, action: selected.isActive ? "block" : "unblock" }); setSelected(null); }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    selected.isActive
                      ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                  }`}
                >
                  {selected.isActive ? "Bloquear cuenta" : "Desbloquear cuenta"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="text-center mb-4">
              <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-3 ${showConfirm.action === "block" ? "bg-red-100" : "bg-green-100"}`}>
                {showConfirm.action === "block" ? (
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                ) : (
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
              <h4 className="text-lg font-semibold text-slate-900">{showConfirm.action === "block" ? "Bloquear usuario" : "Desbloquear usuario"}</h4>
              <p className="text-sm text-slate-500 mt-1">{showConfirm.action === "block" ? `¿Bloquear a ${showConfirm.name}? No podrá iniciar sesión.` : `¿Desbloquear a ${showConfirm.name}? Podrá iniciar sesión nuevamente.`}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(null)} className="flex-1 btn-secondary text-sm">Cancelar</button>
              <button onClick={confirmAction} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors ${showConfirm.action === "block" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
  </div>
    );
}
