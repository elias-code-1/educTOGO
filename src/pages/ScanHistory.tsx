import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Loader2, Camera, Calendar, ArrowLeft, Download } from 'lucide-react';
import { exportToPdf } from '../lib/exportPdf';

export default function ScanHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScans() {
      if (!user) return;
      try {
        const q = query(collection(db, 'users', user.uid, 'scans'), orderBy('createdAt', 'desc'), limit(20));
        const querySnapshot = await getDocs(q);
        const scansData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setScans(scansData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchScans();
  }, [user]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="pb-8 min-h-screen bg-[#F4F6F8]">
      <header className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-20 shadow-sm mb-4">
        <button onClick={() => navigate('/')} className="p-2 bg-gray-100 rounded-full text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-[#003366] text-lg">Historique</h1>
      </header>

      <div className="px-4 space-y-4">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-2xl" />
          ))
        ) : scans.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Aucun scan pour l'instant. Utilise le scanner pour analyser ton premier cours !
          </div>
        ) : (
          scans.map(scan => (
            <div key={scan.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar size={12} /> {formatDate(scan.createdAt)}
                </div>
                <div className="text-xs text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Camera size={10} /> {scan.imageCount} images
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                {scan.summary.substring(0, 100)}...
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/study-pack/${scan.id}`)}
                  className="flex-1 py-2 text-sm font-medium text-white bg-[#003366] rounded-lg"
                >
                  Voir
                </button>
                <button
                  onClick={() => exportToPdf(scan.summary, "resume-date")}
                  className="px-3 py-2 text-sm font-medium text-[#003366] border border-[#003366] rounded-lg"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
