"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

interface Profile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  phone?: string;
  locale?: string;
  timezone?: string;
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res: any = await api.get("/users/profile");
        setProfile(res.data || res);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateField = (key: keyof Profile, value: string) => {
    if (!profile) return;
    setProfile({ ...profile, [key]: value });
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    try {
      const res: any = await api.put("/users/profile", {
        email: profile.email,
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        avatarUrl: profile.avatarUrl || "",
        phone: profile.phone || "",
      });
      const updated = res.data || res;
      setProfile(updated);
      if (user) {
        setUser({ ...user, email: updated.email, firstName: updated.firstName, lastName: updated.lastName, avatarUrl: updated.avatarUrl });
      }
      alert("Perfil actualizado");
    } catch {
      alert("Error al actualizar el perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (newPassword.length < 8) { alert("La nueva contraseña debe tener al menos 8 caracteres"); return; }
    if (newPassword !== confirmPassword) { alert("Las contraseñas no coinciden"); return; }
    setSavingPassword(true);
    try {
      await api.patch("/users/password", { currentPassword, newPassword });
      alert("Contraseña actualizada");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      alert("Error: verifica tu contraseña actual");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <div className="p-8 flex items-center justify-center"><p className="text-slate-500">Cargando perfil...</p></div>;

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Mi Perfil</h1>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Información personal</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input className="input-field" type="email" value={profile?.email || ""} onChange={e => updateField("email", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Teléfono</label>
            <input className="input-field" value={profile?.phone || ""} onChange={e => updateField("phone", e.target.value)} placeholder="+593..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label>
            <input className="input-field" value={profile?.firstName || ""} onChange={e => updateField("firstName", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Apellido</label>
            <input className="input-field" value={profile?.lastName || ""} onChange={e => updateField("lastName", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Avatar URL</label>
            <input className="input-field" value={profile?.avatarUrl || ""} onChange={e => updateField("avatarUrl", e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <button onClick={saveProfile} disabled={savingProfile} className="btn-primary mt-4 text-sm">{savingProfile ? "Guardando..." : "Guardar perfil"}</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Cambiar contraseña</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Contraseña actual</label>
            <input className="input-field" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nueva contraseña</label>
            <input className="input-field" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Confirmar contraseña</label>
            <input className="input-field" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
        </div>
        <button onClick={savePassword} disabled={savingPassword} className="btn-primary mt-4 text-sm">{savingPassword ? "Guardando..." : "Cambiar contraseña"}</button>
      </div>
    </div>
  );
}