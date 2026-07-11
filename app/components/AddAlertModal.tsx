"use client";
import { useState } from 'react';
import { apiFetch } from '@/lib/api-fetch';

const ALERT_TYPES = [
  { value: 'NEST', label: '🐦 Ninho de pássaro' },
  { value: 'BROKEN_HOLD', label: '💔 Agarra quebrada' },
  { value: 'FALL_RISK', label: '⚠️ Risco de queda' },
  { value: 'NO_ACCESS', label: '🚧 Sem acesso' },
];

export default function AddAlertModal({ isOpen, lineId, onClose, onSuccess }: {
  isOpen: boolean;
  lineId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) {
      setError('Selecione um tipo de alerta.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/alerts', {
        method: 'POST',
        body: JSON.stringify({ lineId, type, description: description.trim() || undefined }),
      });
      if (!res.ok) throw new Error('Erro ao criar alerta');
      onSuccess();
      onClose();
    } catch (err) {
      setError('Erro ao criar alerta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Reportar problema</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white"
            >
              <option value="">Selecione...</option>
              {ALERT_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhe o problema..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white"
              rows={3}
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50">
              {loading ? 'Enviando...' : 'Reportar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}