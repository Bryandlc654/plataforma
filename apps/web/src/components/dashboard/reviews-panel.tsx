'use client';
import { useState, useEffect } from 'react';
import { Star, Trash2, CheckCircle2, User, Clock, Plus, X, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

export default function ReviewsPanel() {
  const { user } = useAuthStore();
  const canManage = user?.permissions?.includes('reviews.manage');

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    authorName: '',
    authorEmail: '',
    rating: 5,
    content: '',
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await api.get('/reviews');
      setReviews(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (id: string, current: boolean) => {
    try {
      setReviews(reviews.map(r => r.id === id ? { ...r, isPublished: !current } : r));
      await api.patch(`/reviews/${id}/publish`, { isPublished: !current });
    } catch (e) {
      setReviews(reviews.map(r => r.id === id ? { ...r, isPublished: current } : r));
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta opinión?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      setReviews(reviews.filter(r => r.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const openAddModal = () => {
    setForm({ authorName: '', authorEmail: '', rating: 5, content: '' });
    setFormError('');
    setShowModal(true);
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const res = await api.post('/reviews', {
        authorName: form.authorName,
        rating: form.rating,
        content: form.content,
        authorEmail: form.authorEmail || undefined,
      });
      setReviews([res.data, ...reviews]);
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error al guardar la opinión');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Opiniones de Clientes</h1>
          <p className="text-slate-500 mt-1">Gestiona las reseñas y agrega valoraciones de tus clientes.</p>
        </div>
        {canManage && (
          <button onClick={openAddModal} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> Agregar reseña
          </button>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-32 bg-slate-200 rounded"></div>
            <div className="h-32 bg-slate-200 rounded"></div>
          </div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-12 text-center border-dashed border-2 bg-slate-50 rounded-xl">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
            <Star className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aún no hay opiniones</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            Añade el bloque &apos;Formulario Reseñas&apos; en tu página para empezar a recibir valoraciones de clientes reales.
          </p>
          {canManage && (
            <button onClick={openAddModal} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Agregar primera reseña
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {reviews.map(review => (
            <div key={review.id} className="p-5 flex flex-col md:flex-row gap-6 items-start bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-amber-400">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  {review.isPublished ? (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Visible
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Oculto
                    </span>
                  )}
                </div>
                <p className="text-slate-700 italic mb-4 text-sm">&quot;{review.content}&quot;</p>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4" /> {review.authorName} {review.authorEmail ? `(${review.authorEmail})` : ''}
                  </div>
                  <span>•</span>
                  <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                {(review.ipAddress || review.userAgent) && (
                  <p className="text-xs text-slate-400 mt-2 truncate">
                    IP: {review.ipAddress || '—'} {review.userAgent ? `• ${review.userAgent}` : ''}
                  </p>
                )}
              </div>
              {canManage && (
                <div className="flex flex-row md:flex-col items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    {review.isPublished ? <Eye className="w-4 h-4 text-slate-500" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
                    <span className="text-sm font-medium">{review.isPublished ? 'Visible' : 'Oculto'}</span>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      checked={review.isPublished}
                      onChange={() => togglePublish(review.id, review.isPublished)}
                      title={review.isPublished ? 'Ocultar opinión' : 'Mostrar opinión'}
                    />
                  </div>
                  <button onClick={() => deleteReview(review.id)} className="w-full flex gap-2 text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg text-sm items-center justify-center transition-colors">
                    <Trash2 className="w-4 h-4" /> Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => !saving && setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Agregar reseña</h2>
              <button onClick={() => !saving && setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitReview} className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <label className="text-sm font-semibold text-slate-700">Calificación</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={`text-3xl transition-colors ${star <= form.rating ? 'text-yellow-400' : 'text-slate-300'}`}
                      onClick={() => setForm({ ...form, rating: star })}
                    >★</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={form.authorName}
                  onChange={e => setForm({ ...form, authorName: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo <span className="text-slate-400 text-xs">(opcional)</span></label>
                <input
                  type="email"
                  maxLength={150}
                  value={form.authorEmail}
                  onChange={e => setForm({ ...form, authorEmail: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="cliente@correo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Comentario <span className="text-red-400">*</span></label>
                <textarea
                  required
                  rows={4}
                  maxLength={2000}
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                  placeholder="Escribe la opinión del cliente..."
                />
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Publicar reseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}