import { useEffect, useState } from 'react';
import { subscribeToQuotaStats, QuotaStats } from '../lib/quotaManager';
import { Sparkles, AlertCircle, Key, ShieldCheck } from 'lucide-react';

interface QuotaBarProps {
  uid: string;
}

export default function QuotaBar({ uid }: QuotaBarProps) {
  const [stats, setStats] = useState<QuotaStats | null>(null);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = subscribeToQuotaStats(uid, (newStats) => {
      setStats(newStats);
    });
    return () => unsubscribe();
  }, [uid]);

  if (stats === null) return null;

  if (stats.globalRemaining === 0) {
    return (
      <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium border border-red-100 shadow-sm mb-4">
        <AlertCircle size={18} />
        🔴 Quota IA épuisé. Renouvellement à 1h du matin.
      </div>
    );
  }

  const isWarning = stats.globalRemaining <= 15;

  return (
    <div className={`p-3 rounded-xl flex flex-col gap-2 text-sm font-medium border shadow-sm mb-4 ${isWarning ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
      <div className="flex items-center justify-center gap-2">
        {stats.isUnlimited ? <ShieldCheck size={16} className="text-blue-600" /> : <Sparkles size={16} />}
        {isWarning ? '🟡' : '🟢'} {stats.globalRemaining} requêtes IA {stats.isUnlimited ? "Admin" : "personnelles"} restantes
      </div>
      {(stats.totalKeys > 1 && stats.isUnlimited) && (
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs opacity-90 mt-1 text-blue-800">
          <span className="flex items-center gap-1"><Key size={12}/> Clé: {stats.activeKeyIndex + 1}/{stats.totalKeys}</span>
          <span className="bg-white/50 px-2 py-0.5 rounded-full">{stats.currentKeyRemaining} req/clé</span>
        </div>
      )}
    </div>
  );
}
