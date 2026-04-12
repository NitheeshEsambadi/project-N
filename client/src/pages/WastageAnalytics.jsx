import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, AlertTriangle, ShieldCheck, ArrowRight, Activity, Filter } from 'lucide-react';

const WastageAnalytics = () => {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ avgExpected: 5.0, avgActual: 4.8 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/mgmt/products');
      setProducts(data.filter(p => p.status === 'completed'));
    } catch (err) {
      console.error(err);
    }
  };

  const getWastageStatus = (exp, act) => {
    const diff = act - exp;
    if (diff > 0.5) return { color: 'var(--danger)', icon: <AlertTriangle size={16}/>, text: 'EXCESSIVE' };
    if (diff > 0) return { color: 'rgba(243, 156, 18, 1)', icon: <Activity size={16}/>, text: 'WARNING' };
    return { color: 'var(--success)', icon: <ShieldCheck size={16}/>, text: 'OPTIMAL' };
  };

  return (
    <div className="glass" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 className="gold-gradient">WASTAGE & LOSS ANALYTICS</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Comparative analysis of expected vs actual material loss</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="glass" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', color: 'white' }}>
            <Filter size={18}/> Filter by Worker
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="glass" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <TrendingUp size={60} style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Average Wastage %</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '10px' }}>
                <h2 style={{ fontSize: '2.5rem' }}>4.8%</h2>
                <span style={{ color: 'var(--success)', fontSize: '0.9rem' }}>-0.2% vs target</span>
            </div>
        </div>
        <div className="glass" style={{ padding: '24px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Alerts Generated</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '10px' }}>
                <h2 style={{ fontSize: '2.5rem', color: 'var(--danger)' }}>3</h2>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Extreme variance detected</span>
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
                {products.map(p => {
                    const expVal = p.expectedWeight ? (5.0) : 0; // Simplified for demo
                    const actVal = p.actualWastage ? (p.actualWastage / p.grossWeight * 100).toFixed(2) : 0;
                    const status = getWastageStatus(expVal, actVal);
                    
                    return (
                    <tr key={p._id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '16px 12px' }}>{p.designName}</td>
                        <td style={{ padding: '16px 12px' }}>{p.workerId?.name}</td>
                        <td style={{ padding: '16px 12px' }}>5.0%</td>
                        <td style={{ padding: '16px 12px' }}>{actVal}%</td>
                        <td style={{ padding: '16px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: status.color, fontWeight: 600 }}>
                                {status.icon} {actVal > 5 ? `+${(actVal - 5).toFixed(2)}%` : `${(actVal - 5).toFixed(2)}%`}
                            </div>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                            <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                {status.text}
                            </span>
                        </td>
                    </tr>
                    );
                })}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default WastageAnalytics;
