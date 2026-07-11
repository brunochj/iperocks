"use client";
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import { useRouter } from 'next/navigation';

const typeLabels: Record<string, string> = {
  NEST: '🐦 Ninho',
  BROKEN_HOLD: '💔 Agarra quebrada',
  FALL_RISK: '⚠️ Risco de queda',
  NO_ACCESS: '🚧 Sem acesso',
};

export default function AlertPopover({ isOpen, lineId, onClose, onResolve }: {
  isOpen: boolean;
  lineId: string;
  onClose: () => void;
  onResolve: () => void;
}) {
  const router = useRouter();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !lineId) return;
    setLoading(true);
    apiFetch(`/api/alerts/line/${lineId}`)
      .then(res => res.json())
      .then(data => setAlerts(data.alerts || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, lineId]);

  if (!isOpen) return null;

  const handleResolve = async (alertId: string) => {
    const res = await apiFetch(`/api/alerts/${alertId}`, { method: 'PATCH' });
    if (res.ok) {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      onResolve();
    } else {
      alert('Erro ao resolver alerta');
    }
  };

  return (
    <div className="absolute z-20 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 w-72 max-h-60 overflow-auto border border-gray-200 dark:border-gray-700"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-sm text-gray-900 dark:text-white">Alertas</span>
        <button
          className="text-xs text-indigo-600 hover:underline"
          onClick={() => {
            onClose();
            router.push(`/alerts?lineId=${lineId}`);
          }}
        >
          Ver todos
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : alerts.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum alerta ativo</p>
      ) : (
        <ul className="space-y-2">
          {alerts.slice(0, 5).map((alert) => (
            <li key={alert.id} className="flex justify-between items-start text-sm border-b dark:border-gray-700 pb-1">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">{typeLabels[alert.type] || alert.type}</span>
                {alert.description && <p className="text-xs text-gray-500">{alert.description}</p>}
              </div>
              <button
                onClick={() => handleResolve(alert.id)}
                className="text-green-600 hover:text-green-800 text-xs"
              >
                Resolver
              </button>
            </li>
          ))}
          {alerts.length > 5 && (
            <li className="text-xs text-gray-400 text-center">+ {alerts.length - 5} mais</li>
          )}
        </ul>
      )}
    </div>
  );
}