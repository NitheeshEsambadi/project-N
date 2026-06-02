import React, { useContext, useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import api from '../api';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';
import Workers from './Workers';
import Products from './Products';
import WastageAnalytics from './WastageAnalytics';
import Payments from './Payments';
import Reports from './Reports';
import Settings from './Settings';
import WorkerDetailView from './WorkerDetailView';
import WorkerReceipt from './WorkerReceipt';
import Inventory from './Inventory';
import Sales from './Sales';
import Billing from './Billing';
import { History, ArrowUpRight, ArrowDownLeft, Menu, X, ShoppingBag, RotateCcw } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [appSettings, setAppSettings] = useState({});
  const [company, setCompany] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [dashboardAdditions, setDashboardAdditions] = useState({ totalSales: 0, inventoryValue: 0, inventoryWeight: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, transRes, goldRes, settingsRes, companyRes, saleRes, prodRes] = await Promise.all([
          api.get('/stats/dashboard').catch(() => ({ data: {} })),
          api.get('/mgmt/transactions').catch(() => ({ data: [] })),
          api.get('/mgmt/gold').catch(() => ({ data: [] })),
          api.get('/settings').catch(() => ({ data: [] })),
          api.get('/company').catch(() => ({ data: {} })),
          api.get('/mgmt/sales').catch(() => ({ data: [] })),
          api.get('/mgmt/products?status=completed').catch(() => ({ data: [] }))
        ]);
        
        setStats(statsRes.data);
        
        // Combine transactions and gold issues for a richer "Recent Activity"
        const combinedActivity = [
            ...transRes.data.map(t => ({ ...t, activityType: 'financial' })),
            ...goldRes.data.map(g => ({ ...g, activityType: 'material', type: 'gold', amount: g.weight, notes: `Gold Issued: ${g.weight}g (${g.purity})` }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setRecentActivity(combinedActivity.slice(0, 10));

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

  // Close sidebar on route change (only on mobile)
  useEffect(() => {
    if (window.innerWidth <= 1024) {
      setSidebarOpen(false);
    }
  }, [window.location.pathname]);

  const showGold = appSettings.showGoldRate !== false;
  const showSilver = !!appSettings.showSilverRate;

  return (
    <div className="layout-container">
      <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} />
      
      <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar user={user} logout={logout} closeSidebar={() => setSidebarOpen(false)} company={company} />
      </div>

      <main className={sidebarOpen ? 'sidebar-open' : ''} style={{ flex: 1, padding: '24px', height: '100vh', overflowY: 'auto', position: 'relative' }}>
        <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              className="glass" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: 'var(--primary-gold)' }}
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 style={{ fontSize: '1.8rem', lineHeight: '1.2' }}>Welcome, <span className="gold-gradient">{user?.username}</span></h1>
              {/* <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }} className="desktop-only">Jewellery Worker Management System</p> */}
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

          <Route path="/products" element={<Products />} />
          <Route path="/wastage" element={<WastageAnalytics />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/billing" element={<Billing setSidebarOpen={setSidebarOpen} />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/workers/:id" element={<WorkerDetailView />} />
          <Route path="/worker-receipt" element={<WorkerReceipt />} />
        </Routes>
      </main>
    </div>
  );
};

const Home = ({ stats, user, recentActivity, additions, currency }) => {
  const [showGoldModal, setShowGoldModal] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
        <div onClick={() => setShowGoldModal(true)} style={{ cursor: 'pointer' }}>
          <StatCard title="Gold w/ Workers" value={`${stats?.goldIssued?.toFixed(1) || '0'}g`} />
        </div>
        <StatCard title="Ready Stock" value={`${additions.inventoryWeight.toFixed(1)}g`} />
        <StatCard title="Stock Value" value={`${currency || '₹'} ${additions.inventoryValue.toLocaleString()}`} />
        <StatCard title="Total Revenue" value={`${currency || '₹'} ${additions.totalSales.toLocaleString()}`} />
      </div>

      <div className="glass-card fade-in" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <History size={18} color="var(--primary-gold)"/>
          <h3 style={{ fontSize: '1.1rem' }}>Global Recent Activity</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recentActivity.length > 0 ? recentActivity.map((activity) => (
              <div key={activity._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--hover-bg)', borderRadius: '10px', border: '1px solid var(--glass-border)', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div style={{ 
                  background: activity.activityType === 'material' ? 'rgba(212, 175, 55, 0.1)' : (activity.type === 'earning' ? 'rgba(52, 152, 219, 0.1)' : 'rgba(46, 204, 113, 0.1)'), 
                  padding: '8px', borderRadius: '8px', flexShrink: 0 
                }}>
                  {activity.activityType === 'material' ? <RotateCcw size={16} color="var(--primary-gold)"/> : 
                   (activity.type === 'earning' ? <ArrowUpRight size={16} color="var(--accent-blue)"/> : <ArrowDownLeft size={16} color="var(--success)"/>)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.workerId?.name || 'System'}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.notes}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: activity.activityType === 'material' ? 'var(--primary-gold)' : (activity.type === 'payment' ? 'var(--success)' : 'var(--text-main)') }}>
                   {activity.activityType === 'material' ? '' : (activity.type === 'payment' ? '-' : '+')} 
                   {activity.activityType === 'material' ? `${activity.amount}g` : `₹${activity.amount?.toLocaleString()}`}
                </p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {new Date(activity.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).split(' ').join(' - ')}
                </p>
              </div>
            </div>
          )) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No recent activity</p>
          )}
        </div>
      </div>

      {showGoldModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card fade-in" style={{ width: '90%', maxWidth: '600px', padding: '24px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="gold-gradient">Gold Distribution Among Workers</h3>
              <X size={20} onClick={() => setShowGoldModal(false)} style={{ cursor: 'pointer' }}/>
            </div>
            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <th style={{ padding: '12px' }}>Worker</th>
                    <th style={{ padding: '12px' }}>ID</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Gold Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.goldDistribution?.length > 0 ? stats.goldDistribution.map((d, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '12px' }}>{d.name}</td>
                      <td style={{ padding: '12px' }}>{d.workerID}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: 'var(--primary-gold)' }}>{d.goldBalance.toFixed(3)}g</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No gold currently with workers</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="glass-card" style={{ padding: '16px 20px' }}>
    <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '4px', textTransform: 'uppercase' }}>{title}</p>
    <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{value}</h2>
  </div>
);

export default Dashboard;
