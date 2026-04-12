import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import RoadmapGenerator from '../components/RoadmapGenerator';

export default function Analytics() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'users', user.uid, 'sessions'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sess = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date()
      }));
      setSessions(sess);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <div className="animate-pulse h-96 bg-gray-200 rounded-2xl"></div>;
  }

  // Prepare data for the weekly chart (BarChart)
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  
  const weeklyData = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(startOfCurrentWeek);
    date.setDate(date.getDate() + i);
    
    const daySessions = sessions.filter(s => 
      s.date.getDate() === date.getDate() && 
      s.date.getMonth() === date.getMonth() && 
      s.date.getFullYear() === date.getFullYear()
    );
    
    const minutes = daySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    
    return {
      name: format(date, 'EEE', { locale: fr }),
      minutes,
      fullDate: format(date, 'dd MMM', { locale: fr })
    };
  });

  // Prepare data for the cumulative progression chart (LineChart - Last 14 days)
  const progressionData = Array.from({ length: 14 }).map((_, i) => {
    const date = subDays(today, 13 - i);
    
    // Calculate cumulative minutes up to this date
    const cumulativeMinutes = sessions.filter(s => s.date <= date).reduce((acc, s) => acc + s.durationMinutes, 0);
    
    return {
      date: format(date, 'dd MMM', { locale: fr }),
      heures: Number((cumulativeMinutes / 60).toFixed(1))
    };
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Analytiques & Planning</h1>
        <p className="text-gray-500 mt-1">Suis tes efforts et optimise tes révisions avec l'IA.</p>
      </header>

      {/* Roadmap Generator (AI) */}
      <RoadmapGenerator />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progression Globale (Line Chart) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Progression Globale (Heures cumulées)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ stroke: '#E5E7EB', strokeWidth: 2 }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                />
                <Line type="monotone" dataKey="heures" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Heures étudiées" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temps d'étude hebdo (Bar Chart) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Temps d'étude (Cette semaine)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                />
                <Bar dataKey="minutes" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Minutes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Historique des sessions</h2>
        {sessions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune session enregistrée pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {sessions.map(session => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div>
                  <h4 className="font-semibold text-gray-900">{session.subjectName}</h4>
                  <p className="text-sm text-gray-500">{format(session.date, 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
                  {session.notes && <p className="text-sm text-gray-700 mt-2 italic">"{session.notes}"</p>}
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                  <span className="font-bold text-blue-600">{session.durationMinutes} min</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
