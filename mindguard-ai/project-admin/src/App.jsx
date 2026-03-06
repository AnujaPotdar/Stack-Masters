import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Activity, BarChart3, Database, ShieldAlert, HeartPulse } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './index.css';

function App() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const timestamp = new Date().getTime();
        const res = await axios.get(`http://localhost:8005/api/statistics?t=${timestamp}`);
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch statistics", err);
        setError('Failed to connect to the Project Admin Backend on port 8005.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <Activity className="animate-spin mr-3" size={32} />
        <span className="text-xl">Loading Global Metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-900 text-white p-6">
        <ShieldAlert className="text-red-500 mb-4" size={64} />
        <h2 className="text-2xl font-bold mb-2">Connection Error</h2>
        <p className="text-gray-400 text-center max-w-md">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition">
          Retry Connection
        </button>
      </div>
    );
  }

  const roleData = [
    { name: 'Students', value: stats.roles.students, color: '#3b82f6' },
    { name: 'Soldiers', value: stats.roles.soldiers, color: '#ef4444' },
    { name: 'Adults', value: stats.roles.adults, color: '#10b981' },
    { name: 'Other/Admins', value: stats.roles.other, color: '#8b5cf6' }
  ].filter(d => d.value > 0);

  const riskData = [
    { name: 'Critical Risk', value: stats.global_risk_distribution.critical, color: '#ef4444' },
    { name: 'Moderate Risk', value: stats.global_risk_distribution.moderate, color: '#f59e0b' },
    { name: 'Low Risk', value: stats.global_risk_distribution.low, color: '#10b981' }
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-8 font-sans">
      <header className="flex items-center justify-between mb-10 pb-6 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Database className="text-blue-500" size={36} />
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">MindGuard Super Admin</h1>
            <p className="text-gray-400">Global Project Statistics & Usage Monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-800 bg-opacity-50 px-4 py-2 rounded-full text-sm text-gray-300">
          <Activity size={16} className="text-green-400 animate-pulse" />
          <span>System Online: Port 8005</span>
        </div>
      </header>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-gray-800 bg-opacity-40 p-6 rounded-2xl border border-gray-700 flex items-center gap-6 hover:bg-opacity-60 transition">
          <div className="bg-blue-500 bg-opacity-20 p-4 rounded-xl">
            <Users className="text-blue-400" size={32} />
          </div>
          <div>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Registered Users</p>
            <p className="text-4xl font-bold text-white mt-1">{stats.total_users}</p>
          </div>
        </div>

        <div className="bg-gray-800 bg-opacity-40 p-6 rounded-2xl border border-gray-700 flex items-center gap-6 hover:bg-opacity-60 transition">
          <div className="bg-purple-500 bg-opacity-20 p-4 rounded-xl">
            <HeartPulse className="text-purple-400" size={32} />
          </div>
          <div>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Chat/Therapy Sessions</p>
            <p className="text-4xl font-bold text-white mt-1">{stats.total_chat_sessions}</p>
          </div>
        </div>

        <div className="bg-gray-800 bg-opacity-40 p-6 rounded-2xl border border-gray-700 flex items-center gap-6 hover:bg-opacity-60 transition">
          <div className="bg-red-500 bg-opacity-20 p-4 rounded-xl">
            <ShieldAlert className="text-red-400" size={32} />
          </div>
          <div>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Critical Alerts</p>
            <p className="text-4xl font-bold text-red-400 mt-1">{stats.global_risk_distribution.critical}</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Role Breakdown Bar Chart */}
        <div className="bg-gray-800 bg-opacity-40 p-6 rounded-2xl border border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="text-gray-400" size={24} />
            <h2 className="text-xl font-semibold">User Role Distribution</h2>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  cursor={{ fill: '#374151', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6', borderRadius: '0.5rem' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Risk Distribution Pie Chart */}
        <div className="bg-gray-800 bg-opacity-40 p-6 rounded-2xl border border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <ShieldAlert className="text-gray-400" size={24} />
            <h2 className="text-xl font-semibold">Global Threat Pattern Analysis</h2>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6', borderRadius: '0.5rem' }}
                  itemStyle={{ color: '#f3f4f6' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
