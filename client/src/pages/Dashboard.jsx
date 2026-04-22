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
import Inventory from './Inventory';
import Sales from './Sales';
import { History, ArrowUpRight, ArrowDownLeft, Menu, X, ShoppingBag } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [appSettings, setAppSettings] = useState({});
  const [company, setCompany] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardAdditions, setDashboardAdditions] = useState({ totalSales: 0, inventoryValue: 0, inventoryWeight: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, transRes, settingsRes, companyRes, saleRes, prodRes] = await Promise.all([
          api.get('/stats/dashboard').catch(() => ({ data: {} })),
          api.get('/mgmt/transactions').catch(() => ({ data: [] })),
          api.get('/settings').catch(() => ({ data: [] })),
          api.get('/company').catch(() => ({ data: {} })),
          api.get('/mgmt/sales').catch(() => ({ data: [] })),
          api.get('/mgmt/products?status=completed').catch(() => ({ data: [] }))
        ]);
        setStats(statsRes.data);
        setRecentActivity(transRes.data.slice(0, 5));
        const sObj = settingsRes.data.reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {});
        setAppSettings(sObj);
        setCompany(companyRes.data);
        
        // Custom stats for dashboard
        const totalSales = saleRes.data.reduce((acc, s) => acc + s.totalPrice, 0);
        const invWeight = prodRes.data.reduce((acc, p) => acc + (p.goldWeight || 0), 0);
        const gRate = parseFloat(sObj.goldRate) || 0;
        
        setDashboardAdditions({
            totalSales,
            inventoryValue: invWeight * gRate,
            inventoryWeight: invWeight
        });
      } catch (err) {
        console.error(err);
      }
    };
    
    // Theme Initialization
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }

    fetchData();
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [window.location.pathname]);

  const showGold = appSettings.showGoldRate !== false;
  const showSilver = !!appSettings.showSilverRate;

  return (
    <div className="layout-container">
      <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} />
      
      <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar user={user} logout={logout} closeSidebar={() => setSidebarOpen(false)} company={company} />
      </div>

      <main style={{ flex: 1, padding: '24px', height: '100vh', overflowY: 'auto', position: 'relative' }}>
        <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              className="mobile-only glass" 
              onClick={() => setSidebarOpen(true)}
              style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: 'var(--primary-gold)' }}
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 style={{ fontSize: '1.8rem', lineHeight: '1.2' }}>Welcome, <span className="gold-gradient">{user?.username}</span></h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }} className="desktop-only">Jewellery Worker Management System</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {showGold && (
              <div className="glass" style={{ padding: '8px 15px', borderRadius: '12px', fontSize: '0.75rem', color: 'var(--primary-gold)', border: '1px solid var(--primary-gold)' }}>
                GOLD: ₹{appSettings.goldRate || '5,850'}
              </div>
            )}
            <div className="glass desktop-only" style={{ padding: '8px 15px', borderRadius: '12px', fontSize: '0.75rem' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Home stats={stats} user={user} recentActivity={recentActivity} additions={dashboardAdditions} currency={company.currency} />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/gold" element={<GoldIssuance />} />
          <Route path="/products" element={<Products />} />
          <Route path="/wastage" element={<WastageAnalytics />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/workers/:id" element={<WorkerDetailView />} />
        </Routes>
      </main>
    </div>
  );
};

const Home = ({ stats, user, recentActivity, additions, currency }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
    <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
      <StatCard title="Gold w/ Workers" value={`${stats?.goldIssued?.toFixed(1) || '0'}g`} />
      <StatCard title="Ready Stock" value={`${additions.inventoryWeight.toFixed(1)}g`} />
      <StatCard title="Stock Value" value={`${currency || '₹'} ${additions.inventoryValue.toLocaleString()}`} />
      <StatCard title="Total Revenue" value={`${currency || '₹'} ${additions.totalSales.toLocaleString()}`} />
    </div>

    <div className="glass" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <History size={18} color="var(--primary-gold)"/>
        <h3 style={{ fontSize: '1.1rem' }}>Global Recent Activity</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {recentActivity.length > 0 ? recentActivity.map((activity) => (
            <div key={activity._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--hover-bg)', borderRadius: '10px', border: '1px solid var(--glass-border)', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div style={{ background: activity.type === 'earning' ? 'rgba(52, 152, 219, 0.1)' : 'rgba(46, 204, 113, 0.1)', padding: '8px', borderRadius: '8px', flexShrink: 0 }}>
                {activity.type === 'earning' ? <ArrowUpRight size={16} color="var(--accent-blue)"/> : <ArrowDownLeft size={16} color="var(--success)"/>}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.workerId?.name}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.notes}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: activity.type === 'payment' ? 'var(--success)' : 'var(--text-main)' }}>
                 {activity.type === 'payment' ? '-' : '+'} ₹{activity.amount?.toLocaleString()}
              </p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(activity.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        )) : (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No recent activity</p>
        )}
      </div>
    </div>
  </div>
);

const StatCard = ({ title, value }) => (
  <div className="glass" style={{ padding: '16px 20px' }}>
    <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '4px', textTransform: 'uppercase' }}>{title}</p>
    <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{value}</h2>
  </div>
);

export default Dashboard;
