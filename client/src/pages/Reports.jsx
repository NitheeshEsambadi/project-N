import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../api';
import { BarChart3, FileText, Download, TrendingUp, PieChart, Info, Map, ChevronRight } from 'lucide-react';

const Reports = () => {
  const [data, setData] = useState({ transactions: [], products: [] });

  useEffect(() => {
    const fetchData = async () => {
      const [tRes, pRes] = await Promise.all([
        api.get('/mgmt/transactions'),
        api.get('/mgmt/products')
      ]);
      setData({ transactions: tRes.data, products: pRes.data });
    };
    fetchData();
  }, []);

  const handleExport = (type) => {
    const dataSource = type === 'transactions' ? data.transactions : data.products;
    if (dataSource.length === 0) return alert('No data to export');

    const headers = Object.keys(dataSource[0]).filter(k => k !== '_id' && k !== '__v').join(',');
    const rows = dataSource.map(row => 
        Object.entries(row)
            .filter(([k]) => k !== '_id' && k !== '__v')
            .map(([, v]) => typeof v === 'object' ? v?.name || JSON.stringify(v) : v)
            .join(',')
    ).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${type}_report.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  const reports = [
    { title: 'Gold Circulation Report', desc: 'Summary of gold currently issued, returned, and in stock.', icon: <BarChart3 size={24} color="var(--primary-gold)"/> },
    { title: 'Worker Performance Summary', desc: 'Efficiency, speed, and wastage metrics for all workshop workers.', icon: <TrendingUp size={24} color="var(--success)"/> },
    { title: 'Monthly Expense Report', desc: 'Detailed breakdown of labour payments and operational costs.', icon: <PieChart size={24} color="var(--accent-blue)"/> },
    { title: 'Pending Work Report', desc: 'Listing of all designs currently in production past their due date.', icon: <Info size={24} color="var(--danger)"/> },
    { title: 'Labour Summary', desc: 'Aggregate of total earnings per gram and per piece.', icon: <FileText size={24} color="white"/> },
  ];

  return (
    <div className="glass" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h2 className="gold-gradient">REPORTS & ANALYTICS</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }} className="desktop-only">Generate and export business intelligence reports</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="glass" onClick={() => handleExport('transactions')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', color: 'var(--text-main)', fontSize: '0.8rem' }}>
                <Download size={18}/> <span className="desktop-only">Export CSV (Transactions)</span><span className="mobile-only">Trans. CSV</span>
            </button>
            <button className="btn-primary" onClick={() => handleExport('products')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '0.8rem' }}>
                <FileText size={18}/> <span className="desktop-only">Export CSV (Products)</span><span className="mobile-only">Prod. CSV</span>
            </button>
        </div>
      </div>

      <div className="responsive-grid">
        {reports.map((report, idx) => (
          <div key={idx} className="glass" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'flex-start', cursor: 'pointer', transition: 'var(--transition)' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                {report.icon}
            </div>
            <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{report.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{report.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-gold)', fontSize: '0.8rem', marginTop: '15px', fontWeight: 600 }}>
                    GENERATE REPORT <ChevronRight size={14}/>
                </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass" style={{ marginTop: '40px', padding: '30px', background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.05) 0%, transparent 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Map size={48} color="var(--primary-gold)" opacity={0.5}/>
            <div>
                <h3 style={{ marginBottom: '5px' }}>Operational Insights</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Real-time monitoring of workshop efficiency and material flow.</p>
            </div>
        </div>
        
        <div className="responsive-grid" style={{ marginTop: '30px' }}>
            <Metric title="Circulating Gold" value="1.42 kg" status="optimal" />
            <Metric title="Total Unpaid Labour" value="₹ 45,200" status="on-track" />
            <Metric title="Average Turnaround" value="4.2 Days" status="alert" />
            <Metric title="Workshop Efficiency" value="94.2%" status="optimal" />
        </div>

        <div style={{ marginTop: '40px', padding: '20px', background: 'rgba(0,0,0,0.1)', borderRadius: '15px' }}>
            <h4 style={{ marginBottom: '20px', fontSize: '0.9rem', color: 'var(--primary-gold)' }}>WASTAGE TREND (LAST 6 MONTHS)</h4>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px', height: '150px', padding: '0 20px' }}>
                {[
                    { month: 'Jan', val: 60, loss: '3.1g' },
                    { month: 'Feb', val: 85, loss: '4.2g' },
                    { month: 'Mar', val: 45, loss: '2.8g' },
                    { month: 'Apr', val: 100, loss: '5.1g' },
                    { month: 'May', val: 75, loss: '3.9g' },
                    { month: 'Jun', val: 30, loss: '1.5g' }
                ].map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '100%', height: `${d.val}%`, background: d.val > 80 ? 'var(--danger)' : 'var(--primary-gold)', borderRadius: '4px 4px 0 0', position: 'relative' }} title={d.loss}>
                            <span style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', fontWeight: 600 }}>{d.loss}</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{d.month}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

const Metric = ({ title, value, status }) => (
    <div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{title}</p>
        <h4 style={{ fontSize: '1.6rem', marginTop: '5px' }}>{value}</h4>
        <div style={{ 
            height: '4px', width: '40px', background: status === 'optimal' ? 'var(--success)' : status === 'alert' ? 'var(--danger)' : 'var(--primary-gold)',
            marginTop: '10px', borderRadius: '2px'
        }}></div>
    </div>
);

export default Reports;
