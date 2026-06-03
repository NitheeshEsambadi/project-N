import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../api';
import { BarChart3, FileText, Download, TrendingUp, PieChart, Info, Map, ChevronRight } from 'lucide-react';

const Reports = () => {
  const [data, setData] = useState({ transactions: [], products: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tRes, pRes] = await Promise.all([
          api.get('/mgmt/transactions').catch(() => ({ data: [] })),
          api.get('/mgmt/products').catch(() => ({ data: [] }))
        ]);
        setData({ transactions: tRes.data || [], products: pRes.data || [] });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
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

  const generateReport = (title) => {
    let csvContent = "";
    let fileName = "";
    
    if (title === 'Gold Circulation Report') {
        fileName = 'gold_circulation_report.csv';
        csvContent = "Product ID,Category,Design,Status,Gross Weight,Net Weight,Actual Wastage,Date\n";
        data.products.forEach(p => {
            csvContent += `"${p.productId}","${p.category || ''}","${p.designName || ''}","${p.status || ''}",${p.grossWeight || 0},${p.netWeight || 0},${p.actualWastage || 0},"${new Date(p.createdAt).toLocaleDateString()}"\n`;
        });
    } else if (title === 'Worker Performance Summary') {
        fileName = 'worker_performance_summary.csv';
        const workerStats = {};
        data.products.forEach(p => {
            const wName = p.workerId?.name || 'Unknown';
            if (!workerStats[wName]) {
                workerStats[wName] = { completed: 0, totalWastage: 0 };
            }
            if (p.status === 'completed') {
                workerStats[wName].completed += 1;
                workerStats[wName].totalWastage += (p.actualWastage || 0);
            }
        });
        csvContent = "Worker Name,Completed Products,Total Actual Wastage (g)\n";
        Object.entries(workerStats).forEach(([name, s]) => {
            csvContent += `"${name}",${s.completed},${s.totalWastage.toFixed(3)}\n`;
        });
    } else if (title === 'Monthly Expense Report') {
        fileName = 'monthly_expense_report.csv';
        csvContent = "Date,Worker,Type,Payment Mode,Amount,Notes\n";
        data.transactions.forEach(t => {
            csvContent += `"${new Date(t.createdAt).toLocaleDateString()}","${t.workerId?.name || ''}","${t.type || ''}","${t.paymentMode || ''}",${t.amount || 0},"${t.notes || ''}"\n`;
        });
    } else if (title === 'Pending Work Report') {
        fileName = 'pending_work_report.csv';
        csvContent = "Product ID,Category,Design,Expected Weight,Worker,Due Date\n";
        data.products.filter(p => p.status !== 'completed').forEach(p => {
            csvContent += `"${p.productId}","${p.category || ''}","${p.designName || ''}",${p.expectedWeight || 0},"${p.workerId?.name || 'Unassigned'}","${p.dueDate ? new Date(p.dueDate).toLocaleDateString() : '—'}"\n`;
        });
    } else {
        fileName = 'labour_summary.csv';
        csvContent = "Worker Name,Total Earning,Total Payment,Net Due\n";
        const wStats = {};
        data.transactions.forEach(t => {
            const name = t.workerId?.name || 'Unknown';
            if (!wStats[name]) wStats[name] = { earning: 0, payment: 0 };
            if (t.type === 'earning') wStats[name].earning += (t.amount || 0);
            if (t.type === 'payment') wStats[name].payment += (t.amount || 0);
        });
        Object.entries(wStats).forEach(([name, s]) => {
            csvContent += `"${name}",${s.earning},${s.payment},${s.earning - s.payment}\n`;
        });
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', fileName);
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

  if (loading) return <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>Loading Reports...</div>;

  // Operational metrics
  const circulatingGold = data.products
    .filter(p => p.status !== 'completed')
    .reduce((acc, p) => acc + (p.expectedWeight || 0), 0) / 1000; // in kg

  const unpaidLabour = data.transactions.reduce((acc, t) => {
    if (t.type === 'earning') return acc + (t.amount || 0);
    if (t.type === 'payment') return acc - (t.amount || 0);
    return acc;
  }, 0);

  const completedProds = data.products.filter(p => p.status === 'completed');
  const qcPassed = completedProds.filter(p => p.qualityCheck === 'passed').length;
  const efficiency = completedProds.length > 0 ? (qcPassed / completedProds.length * 100) : 100;

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
          <div key={idx} onClick={() => generateReport(report.title)} className="glass card-hover" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'flex-start', cursor: 'pointer', transition: 'var(--transition)', border: '1px solid var(--glass-border)' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                {report.icon}
            </div>
            <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{report.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{report.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-gold)', fontSize: '0.8rem', marginTop: '15px', fontWeight: 600 }}>
                    DOWNLOAD REPORT <ChevronRight size={14}/>
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
            <Metric title="Circulating Gold" value={`${circulatingGold.toFixed(3)} kg`} status={circulatingGold > 1 ? 'alert' : 'optimal'} />
            <Metric title="Total Unpaid Labour" value={`₹ ${unpaidLabour.toLocaleString()}`} status={unpaidLabour > 20000 ? 'alert' : 'optimal'} />
            <Metric title="Average Turnaround" value="4.2 Days" status="optimal" />
            <Metric title="Workshop Efficiency" value={`${efficiency.toFixed(1)}%`} status={efficiency > 90 ? 'optimal' : 'alert'} />
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
