"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { formatDate } from "@/lib/utils";
import { useConfirm } from "@/components/providers/confirm-provider";

interface Member { id: string; user: { id: string; email: string; firstName: string; lastName: string }; roles: Array<{ id: string; name: string }>; isOwner: boolean; joinedAt: string; }
interface Role { id: string; name: string; description: string; }
interface Invitation { id: string; email: string; status: string; roleId: string; createdAt: string; expiresAt: string; }

export default function UsersPage() {
  const { tenant, tenantId, user } = useAuthStore();
  const [members, setMembers] = useState<Member[]>([]); const [roles, setRoles] = useState<Role[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]); const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false); const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState(""); const [sending, setSending] = useState(false); const [toast, setToast] = useState<string | null>(null);
  const { confirm } = useConfirm(); const canManage = user?.permissions?.includes("role.manage");
  const fetchInvitations = useCallback(async () => {
    try { const res: any = await api.get("/invitations"); setInvitations(res.data || res); }
    catch { setInvitations([]); }
  }, []);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [mRes, rRes]: any[] = await Promise.all([api.get(`/tenants/${tenantId}/users`), api.get("/roles")]);
      setMembers(mRes.data || mRes);
      const tr = (rRes.data || rRes).filter((r: Role) => r.name !== "super_admin" && r.name !== "support" && r.name !== "owner");
      setRoles(tr);
      if (tr.length > 0 && !inviteRole) setInviteRole(tr[0].id);
    } catch {} finally { setLoading(false); }
  }, [inviteRole, tenantId]);

  useEffect(() => { if (tenantId) { fetchData(); fetchInvitations(); } }, [fetchData, fetchInvitations, tenantId]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);
  const sendInvitation = async () => { if (!inviteEmail.trim() || !inviteRole) return; setSending(true); try { await api.post("/invitations", { email: inviteEmail, roleId: inviteRole }); setShowInvite(false); setInviteEmail(""); setToast("Invitación enviada"); fetchInvitations(); } catch (err: any) { alert(err.response?.data?.message || "Error al enviar invitación"); } finally { setSending(false); } };
  const revokeInvitation = async (id: string) => { await api.delete(`/invitations/${id}`); fetchInvitations(); };
  const changeRole = async (memberId: string, roleId: string, currentRoles: any[]) => { try { const hasRole = currentRoles.some((r: any) => r.id === roleId); if (hasRole) { await api.delete(`/roles/remove/${memberId}/${roleId}`); } else { await api.post("/roles/assign", { userTenantId: memberId, roleId }); } fetchData(); } catch {} };
  const removeMember = async (memberId: string, userName: string) => { if (!(await confirm(`¿Eliminar a ${userName} del negocio?`))) return; try { await api.delete(`/tenants/${tenantId}/members/${memberId}`); fetchData(); } catch (err: any) { alert(err.response?.data?.message || "Error al eliminar miembro"); } };
  if (loading) return <div className="p-8 flex items-center justify-center"><p className="text-slate-500">Cargando...</p></div>;
  return (
    <div className="p-8">
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium shadow-lg">{toast}</div>}
      <div className="flex items-center justify-between mb-8"><div><h1 className="text-2xl font-bold text-slate-900">Usuarios</h1><p className="text-sm text-slate-600 mt-1">{members.length} miembros · {tenant?.name}</p></div>{canManage && <button onClick={() => setShowInvite(!showInvite)} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>Invitar usuario</button>}</div>
      {showInvite && <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6"><h3 className="font-semibold text-slate-900 mb-4">Invitar nuevo usuario</h3><div className="flex flex-col sm:flex-row gap-3 items-end"><div className="flex-1"><label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label><input className="input-field" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="usuario@email.com" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Rol</label><select className="input-field w-40" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div><button onClick={sendInvitation} disabled={sending} className="btn-primary text-sm whitespace-nowrap">{sending ? "Enviando..." : "Enviar invitación"}</button><button onClick={() => setShowInvite(false)} className="btn-ghost text-sm whitespace-nowrap">Cancelar</button></div></div>}
      {invitations.filter((i) => i.status === "pending").length > 0 && <div className="bg-amber-50/50 rounded-xl border border-amber-200 p-5 mb-6"><h3 className="font-semibold text-slate-900 mb-3">Invitaciones pendientes</h3><div className="space-y-2">{invitations.filter((i) => i.status === "pending").map((inv) => { const role = roles.find((r) => r.id === inv.roleId); return (<div key={inv.id} className="flex items-center justify-between text-sm bg-white rounded-lg px-4 py-2.5 border border-amber-100"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-medium">?</div><div><p className="font-medium text-slate-800">{inv.email}</p><p className="text-xs text-slate-500">{role?.name || "Sin rol"} · Expira {formatDate(inv.expiresAt)}</p></div></div><button onClick={() => revokeInvitation(inv.id)} className="text-xs text-red-500 hover:text-red-700">Revocar</button></div>); })}</div></div>}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden"><div className="px-6 py-4 border-b border-slate-200"><h3 className="font-semibold text-slate-900">Miembros ({members.length})</h3></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-50 border-b border-slate-200"><th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Usuario</th><th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Roles</th><th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Tipo</th><th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Acción</th></tr></thead><tbody className="divide-y divide-slate-100">{members.map((m) => (<tr key={m.id} className="hover:bg-slate-50/50"><td className="py-3 px-4"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-xs flex-shrink-0">{(m.user.firstName?.[0] || "") + (m.user.lastName?.[0] || "") || m.user.email[0].toUpperCase()}</div><div><p className="font-medium text-slate-900">{m.user.firstName} {m.user.lastName}</p><p className="text-xs text-slate-400">{m.user.email}</p></div></div></td><td className="py-3 px-4"><div className="flex gap-1 flex-wrap">{roles.map((role) => { const has = m.roles.some((r) => r.id === role.id); const isSelf = m.user.id === user?.id; const canToggle = !!canManage && !m.isOwner && !isSelf; return (<button key={role.id} onClick={() => changeRole(m.id, role.id, m.roles)} disabled={!canToggle} title={!canToggle ? "No tienes permisos para gestionar roles" : undefined} className={`rounded-full px-2.5 py-1 text-xs border transition-all ${has ? "bg-primary-50 text-primary-700 border-primary-200 font-medium" : "bg-white text-slate-400 border-slate-200 hover:border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed"}`}>{role.name}</button>); })}</div></td><td className="py-3 px-4 text-center"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${m.isOwner ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-600"}`}>{m.isOwner ? "Propietario" : "Miembro"}</span></td><td className="py-3 px-4 text-center">{!m.isOwner && !!canManage && <button onClick={() => removeMember(m.id, `${m.user.firstName} ${m.user.lastName}`)} className="text-xs text-red-500 hover:text-red-700 font-medium">Eliminar</button>}</td></tr>))}</tbody></table></div></div>
    </div>);
}
