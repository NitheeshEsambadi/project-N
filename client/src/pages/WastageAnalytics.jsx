import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../api';
import { TrendingUp, AlertTriangle, ShieldCheck, ArrowRight, Activity, Filter } from 'lucide-react';

const WastageAnalytics = () => {
  const [products, setProducts] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, workerRes] = await Promise.all([
        api.get('/mgmt/products'),
        api.get('/workers')
      ]);
      setProducts(prodRes.data || []);
      setWorkers(workerRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getWastageStatus = (exp, act) => {
    const diff = act - exp;
    if (diff > 0.5) return { color: 'var(--danger)', icon: <AlertTriangle size={16}/>, text: 'EXCESSIVE' };
    if (diff > 0) return { color: 'rgba(243, 156, 18, 1)', icon: <Activity size={16}/>, text: 'WARNING' };
    return { color: 'var(--success)', icon: <ShieldCheck size={16}/>, text: 'OPTIMAL' };
  };

  if (loading) return <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>Loading Wastage Analytics...</div>;

  const completedProducts = products.filter(p => p.status === 'completed');
  const filteredProducts = completedProducts.filter(p => 
    !selectedWorkerId || p.workerId?._id === selectedWorkerId || p.workerId === selectedWorkerId
  );

  // Calculations
  const totalActualWastage = filteredProducts.reduce((sum, p) => sum + (p.actualWastage || 0), 0);
  const totalGrossWeight = filteredProducts.reduce((sum, p) => sum + (p.grossWeight || 0), 0);
  const avgWastagePct = totalGrossWeight > 0 ? (totalActualWastage / totalGrossWeight * 100) : 0;
  
  const alertsCount = filteredProducts.filter(p => {
    const actVal = p.actualWastage && p.grossWeight ? (p.actualWastage / p.grossWeight * 100) : 0;
    return actVal - 5.0 > 0.5; // Variance > 0.5% (target is 5.0%)
  }).length;

  return (
    <div className="glass" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 className="gold-gradient">WASTAGE & LOSS ANALYTICS</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Comparative analysis of expected vs actual material loss</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Worker:</span>
          <select 
            value={selectedWorkerId} 
            onChange={e => setSelectedWorkerId(e.target.value)} 
            className="glass" 
            style={{ padding: '10px 16px', background: 'var(--surface-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', borderRadius: '8px', outline: 'none' }}
          >
            <option value="">All Workers</option>
            {workers.map(w => (
              <option key={w._id} value={w._id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="glass" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <TrendingUp size={60} style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Average Wastage %</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '10px' }}>
                <h2 style={{ fontSize: '2.5rem' }}>{avgWastagePct.toFixed(2)}%</h2>
                <span style={{ color: avgWastagePct <= 5.0 ? 'var(--success)' : 'var(--danger)', fontSize: '0.9rem' }}>
                    {(avgWastagePct - 5.0) <= 0 ? `${(avgWastagePct - 5.0).toFixed(2)}% vs target` : `+${(avgWastagePct - 5.0).toFixed(2)}% vs target`}
                </span>
            </div>
        </div>
        <div className="glass" style={{ padding: '24px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Alerts Generated</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '10px' }}>
                <h2 style={{ fontSize: '2.5rem', color: alertsCount > 0 ? 'var(--danger)' : 'var(--success)' }}>{alertsCount}</h2>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Extreme variance ( &gt; 0.5% ) detected</span>
            </div>
        </div>
      </div>

      <div className="glass" style={{ padding: '24px' }}>
        <h3 style={{ marginBottom: '20px' }}>Material Performance by Product</h3>
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <th style={{ padding: '12px' }}>DESIGN NAME</th>
                <th style={{ padding: '12px' }}>WORKER</th>
                <th style={{ padding: '12px' }}>EXPECTED %</th>
                <th style={{ padding: '12px' }}>ACTUAL %</th>
                <th style={{ padding: '12px' }}>VARIANCE</th>
                <th style={{ padding: '12px' }}>QC STATUS</th>
                </tr>
            </thead>
            <tbody>
                {filteredProducts.map(p => {
                    const expVal = 5.0; // Standard baseline target
                    const actVal = p.actualWastage && p.grossWeight ? parseFloat((p.actualWastage / p.grossWeight * 100).toFixed(2)) : 0;
                    const status = getWastageStatus(expVal, actVal);
                    const variance = actVal - expVal;
                    
                    return (
                    <tr key={p._id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '16px 12px' }}>{p.designName}</td>
                        <td style={{ padding: '16px 12px' }}>{p.workerId?.name || '—'}</td>
                        <td style={{ padding: '16px 12px' }}>5.00%</td>
                        <td style={{ padding: '16px 12px' }}>{actVal.toFixed(2)}%</td>
                        <td style={{ padding: '16px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: status.color, fontWeight: 600 }}>
                                {status.icon} {variance > 0 ? `+${variance.toFixed(2)}%` : `${variance.toFixed(2)}%`}
                            </div>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                            <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', color: status.color, fontWeight: 600 }}>
                                {status.text}
                            </span>
                        </td>
                    </tr>
                    );
                })}
                {filteredProducts.length === 0 && (
                    <tr>
                        <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No completed products found for this selection.</td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default WastageAnalytics;
