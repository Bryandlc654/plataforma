'use client';
import { useState, useEffect } from 'react';
import { Star, Trash2, CheckCircle2, User, Clock } from 'lucide-react';
import api from '@/lib/api';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Opiniones de Clientes</h1>
          <p className="text-slate-500 mt-1">Gestiona las reseñas reales que dejan tus clientes en tu sitio web.</p>
        </div>
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
            Añade el bloque 'Formulario Reseñas' en tu página para empezar a recibir valoraciones de clientes reales.
          </p>
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
                      <CheckCircle2 className="w-3 h-3" /> Publicado
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Pendiente
                    </span>
                  )}
                </div>
                <p className="text-slate-700 italic mb-4 text-sm">"{review.content}"</p>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4" /> {review.authorName} {review.authorEmail ? `(${review.authorEmail})` : ''}
                  </div>
                  <span>•</span>
                  <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex flex-row md:flex-col items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Publicar</span>
                  <input 
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    checked={review.isPublished} 
                    onChange={() => togglePublish(review.id, review.isPublished)} 
                  />
                </div>
                <button onClick={() => deleteReview(review.id)} className="w-full flex gap-2 text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg text-sm items-center justify-center transition-colors">
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
