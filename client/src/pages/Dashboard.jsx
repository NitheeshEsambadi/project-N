import React, { useContext, useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import api from '../api';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';
import Workers from './Workers';
import GoldIssuance from './GoldIssuance';
import Products from './Products';
import WastageAnalytics from './WastageAnalytics';
import Payments from './Payments';
import Reports from './Reports';
import Settings from './Settings';
import WorkerDetailView from './WorkerDetailView';
import { History, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [appSettings, setAppSettings] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, transRes, settingsRes] = await Promise.all([
          api.get('/stats/dashboard'),
          api.get('/mgmt/transactions'),
          api.get('/settings')
        ]);
        setStats(statsRes.data);
        setRecentActivity(transRes.data.slice(0, 5));
        const sObj = settingsRes.data.reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {});
        setAppSettings(sObj);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const showGold = appSettings.showGoldRate !== false;
  const showSilver = !!appSettings.showSilverRate;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar user={user} logout={logout} />
      <main style={{ flex: 1, padding: '20px', height: '100vh', overflowY: 'auto' }}>
        <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem' }}>Welcome back, <span className="gold-gradient">{user?.username}</span></h1>
            <p style={{ color: 'var(--text-muted)' }}>Jewellery Worker Management System</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {showGold && (
              <div className="glass" style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--primary-gold)', border: '1px solid var(--primary-gold)' }}>
                GOLD: ₹ {appSettings.goldRate || '5,850'}/g
              </div>
            )}
            {showSilver && (
              <div className="glass" style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '0.85rem', color: '#C0C0C0', border: '1px solid #C0C0C0' }}>
                SILVER: ₹ {appSettings.silverRate || '75'}/g
              </div>
            )}
            <div className="glass" style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '0.85rem' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Home stats={stats} user={user} recentActivity={recentActivity} />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/gold" element={<GoldIssuance />} />
          <Route path="/products" element={<Products />} />
          <Route path="/wastage" element={<WastageAnalytics />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/workers/:id" element={<WorkerDetailView />} />
        </Routes>
      </main>
    </div>
  );
};

const Home = ({ stats, user, recentActivity }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
      <StatCard title="Gold Issued" value={`${stats?.goldIssued?.toFixed(1) || '0'}g`} trend="+5%" />
      <StatCard title="Completed Products" value={stats?.completedProducts || '0'} trend="+12%" />
      <StatCard title="Total Earning" value={`₹ ${stats?.totalEarnings?.toLocaleString() || '0'}`} trend="+8%" />
      <StatCard title="Total Payments" value={`₹ ${stats?.totalPayments?.toLocaleString() || '0'}`} trend="-2%" />
    </div>

    <div className="glass" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <History size={18} color="var(--primary-gold)"/>
        <h3 style={{ fontSize: '1.1rem' }}>Global Recent Activity</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {recentActivity.length > 0 ? recentActivity.map((activity) => (
          <div key={activity._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ background: activity.type === 'earning' ? 'rgba(52, 152, 219, 0.1)' : 'rgba(46, 204, 113, 0.1)', padding: '8px', borderRadius: '8px' }}>
                {activity.type === 'earning' ? <ArrowUpRight size={16} color="var(--accent-blue)"/> : <ArrowDownLeft size={16} color="var(--success)"/>}
              </div>
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{activity.workerId?.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activity.notes}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: activity.type === 'payment' ? 'var(--success)' : 'white' }}>
                {activity.type === 'payment' ? '-' : '+'} ₹{activity.amount?.toLocaleString()}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(activity.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        )) : (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No recent activity</p>
        )}
      </div>
    </div>
  </div>
);

const StatCard = ({ title, value, trend }) => (
  <div className="glass" style={{ padding: '24px' }}>
    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase' }}>{title}</p>
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 600 }}>{value}</h2>
      <span style={{ color: trend.startsWith('+') ? 'var(--success)' : 'var(--danger)', fontSize: '0.9rem' }}>{trend}</span>
    </div>
  </div>
);

export default Dashboard;
