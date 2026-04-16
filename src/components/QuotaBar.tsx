import { useEffect, useState } from 'react';
import { subscribeToQuota } from '../lib/quotaManager';
import { Sparkles, AlertCircle } from 'lucide-react';

interface QuotaBarProps {
  uid: string;
}

export default function QuotaBar({ uid }: QuotaBarProps) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = subscribeToQuota(uid, (rem) => {
      setRemaining(rem);
    });
    return () => unsubscribe();
  }, [uid]);

  if (remaining === null) return null;

  if (remaining === 0) {
    return (
      <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium border border-red-100 shadow-sm mb-4">
        <AlertCircle size={18} />
        🔴 Quota IA épuisé. Renouvellement à 1h du matin.
      </div>
    );
  }

  if (remaining <= 5) {
    return (
      <div className="bg-amber-50 text-amber-700 p-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium border border-amber-100 shadow-sm mb-4">
        <Sparkles size={16} />
        🟡 Attention : {remaining} requêtes IA restantes aujourd'hui
      </div>
    );
  }

  return (
    <div className="bg-green-50 text-green-700 p-2 rounded-xl flex items-center justify-center gap-2 text-xs font-medium border border-green-100 opacity-80 mb-4">
      <Sparkles size={14} />
      🟢 {remaining} requêtes IA disponibles aujourd'hui
    </div>
  );
}
