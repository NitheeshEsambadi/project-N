import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, Coins, Package, CreditCard, History, AlertCircle, Phone, Hammer, RotateCcw
} from 'lucide-react';

const WorkerDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [goldIssues, setGoldIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [workerRes, statsRes, transRes, productRes, goldRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/workers/${id}`),
        axios.get(`http://localhost:5000/api/stats/worker/${id}`),
        axios.get(`http://localhost:5000/api/mgmt/transactions?workerId=${id}`),
        axios.get(`http://localhost:5000/api/mgmt/products?workerId=${id}`),
        axios.get(`http://localhost:5000/api/gold?workerId=${id}`)
      ]);
      setWorker(workerRes.data);
      setStats(statsRes.data);
      setTransactions(transRes.data);
      setProducts(productRes.data || []);
      setGoldIssues(goldRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>Loading worker data...</div>;
  if (!worker) return <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>Worker not found</div>;

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'products', label: `Products (${products.length})` },
    { key: 'gold', label: `Gold History (${goldIssues.length})` },
    { key: 'transactions', label: `Transactions (${transactions.length})` },
  ];

  return (
    <div style={{ padding: '10px' }}>
      <button 
        onClick={() => navigate('/workers')}
        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '20px' }}
      >
        <ArrowLeft size={18}/> Back to Workers
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
        {/* Profile Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass" style={{ padding: '30px', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-gold)', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', fontSize: '2rem', fontWeight: 'bold' }}>
                    {worker.name[0]}
                </div>
                <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '6px', background: 'rgba(212,175,55,0.15)', color: 'var(--primary-gold)', fontFamily: 'monospace', fontWeight: 600 }}>
                    {worker.workerID || 'N/A'}
                </span>
                <h3 style={{ marginTop: '10px' }}>{worker.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{worker.specialization}</p>

                <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', fontSize: '0.85rem', textAlign: 'left' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '5px' }}>Contact</p>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={14} color="var(--primary-gold)"/> {worker.contact || 'Not provided'}
                    </p>
                    <p style={{ color: 'var(--text-muted)', margin: '10px 0 5px' }}>Labour Rate</p>
                    <p>{worker.labourRateType === 'perGram' ? `₹${worker.baseRate}/g` : worker.labourRateType === 'perPiece' ? `₹${worker.baseRate}/pc` : `₹${worker.baseRate} Fixed`}</p>
                </div>
            </div>

            <div className="glass" style={{ padding: '20px', background: 'rgba(231, 76, 60, 0.05)', border: '1px solid rgba(231, 76, 60, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger)', marginBottom: '10px' }}>
                    <AlertCircle size={18}/>
                    <h4 style={{ fontSize: '0.9rem' }}>Financial Summary</h4>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Due Amount</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>₹ {((stats?.totalEarnings || 0) - (stats?.totalPayments || 0)).toLocaleString()}</span>
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <MetricCard icon={<Coins size={20} color="var(--primary-gold)"/>} title="Gold Balance" value={`${((stats?.goldIssued || 0) - (stats?.goldReturned || 0)).toFixed(2)}g`} />
                <MetricCard icon={<Package size={20} color="var(--accent-blue)"/>} title="Completed" value={stats?.completedProducts || 0} subtitle="Finished Products" />
                <MetricCard icon={<CreditCard size={20} color="var(--success)"/>} title="Total Earnings" value={`₹ ${(stats?.totalEarnings || 0).toLocaleString()}`} />
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '5px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '10px' }}>
                {tabs.map(tab => (
                    <button 
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'var(--transition)',
                            background: activeTab === tab.key ? 'rgba(212,175,55,0.15)' : 'transparent',
                            color: activeTab === tab.key ? 'var(--primary-gold)' : 'var(--text-muted)',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && <OverviewTab stats={stats} goldIssues={goldIssues} />}
            {activeTab === 'products' && <ProductsTab products={products} />}
            {activeTab === 'gold' && <GoldHistoryTab goldIssues={goldIssues} />}
            {activeTab === 'transactions' && <TransactionsTab transactions={transactions} />}
        </div>
      </div>
    </div>
  );
};

/* ──────────── TAB: Overview ──────────── */
const OverviewTab = ({ stats, goldIssues }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <History size={18} color="var(--primary-gold)"/>
                <h3>Production Status</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                <ProgressBox label="Gold Issued" value={`${stats?.goldIssued || 0}g`} color="var(--primary-gold)" />
                <ProgressBox label="Gold Returned" value={`${stats?.goldReturned || 0}g`} color="var(--success)" />
                <ProgressBox label="Pending Gold" value={`${((stats?.goldIssued || 0) - (stats?.goldReturned || 0)).toFixed(2)}g`} color="var(--danger)" />
            </div>
        </div>
        <div className="glass" style={{ padding: '24px' }}>
            <h4 style={{ marginBottom: '15px' }}>Recent Gold Requests</h4>
            {goldIssues.length > 0 ? goldIssues.slice(0, 3).map(g => (
                <div key={g._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                    <span>{g.weight}g ({g.purity})</span>
                    <span style={{ color: g.status === 'issued' ? 'var(--primary-gold)' : g.status === 'completed' ? 'var(--success)' : 'var(--accent-blue)', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 600 }}>
                        {g.status}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{new Date(g.createdAt).toLocaleDateString()}</span>
                </div>
            )) : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No gold requests yet.</p>}
        </div>
    </div>
);

/* ──────────── TAB: Products ──────────── */
const ProductsTab = ({ products }) => (
    <div className="glass" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Hammer size={18} color="var(--primary-gold)"/>
            <h3>Products Made & Returned</h3>
        </div>
        {products.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        <th style={{ padding: '10px' }}>DESIGN</th>
                        <th style={{ padding: '10px' }}>GOLD WEIGHT</th>
                        <th style={{ padding: '10px' }}>STATUS</th>
                        <th style={{ padding: '10px' }}>DATE</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => (
                        <tr key={p._id} style={{ borderTop: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                            <td style={{ padding: '12px 10px', fontWeight: 500 }}>{p.designName}</td>
                            <td style={{ padding: '12px 10px' }}>{p.goldWeight}g</td>
                            <td style={{ padding: '12px 10px' }}>
                                <span style={{ 
                                    padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                                    background: p.status === 'completed' ? 'rgba(46,204,113,0.1)' : 'rgba(212,175,55,0.1)',
                                    color: p.status === 'completed' ? 'var(--success)' : 'var(--primary-gold)'
                                }}>
                                    {p.status}
                                </span>
                            </td>
                            <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '30px' }}>No products assigned to this worker yet.</p>}
    </div>
);

/* ──────────── TAB: Gold History ──────────── */
const GoldHistoryTab = ({ goldIssues }) => (
    <div className="glass" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <RotateCcw size={18} color="var(--primary-gold)"/>
            <h3>Gold Issue & Return History</h3>
        </div>
        {goldIssues.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        <th style={{ padding: '10px' }}>DATE</th>
                        <th style={{ padding: '10px' }}>WEIGHT</th>
                        <th style={{ padding: '10px' }}>PURITY</th>
                        <th style={{ padding: '10px' }}>WASTAGE %</th>
                        <th style={{ padding: '10px' }}>STATUS</th>
                        <th style={{ padding: '10px' }}>NOTES</th>
                    </tr>
                </thead>
                <tbody>
                    {goldIssues.map(g => (
                        <tr key={g._id} style={{ borderTop: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                            <td style={{ padding: '12px 10px' }}>{new Date(g.createdAt).toLocaleDateString()}</td>
                            <td style={{ padding: '12px 10px', fontWeight: 600 }}>{g.weight}g</td>
                            <td style={{ padding: '12px 10px' }}>{g.purity}</td>
                            <td style={{ padding: '12px 10px' }}>{g.expectedWastage}%</td>
                            <td style={{ padding: '12px 10px' }}>
                                <span style={{ 
                                    padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                                    background: g.status === 'completed' ? 'rgba(46,204,113,0.1)' : g.status === 'returned' ? 'rgba(52,152,219,0.1)' : 'rgba(212,175,55,0.1)',
                                    color: g.status === 'completed' ? 'var(--success)' : g.status === 'returned' ? 'var(--accent-blue)' : 'var(--primary-gold)'
                                }}>
                                    {g.status}
                                </span>
                            </td>
                            <td style={{ padding: '12px 10px', color: 'var(--text-muted)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {g.notes || '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '30px' }}>No gold issue records found.</p>}
    </div>
);

/* ──────────── TAB: Transactions ──────────── */
const TransactionsTab = ({ transactions }) => (
    <div className="glass" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <History size={18} color="var(--primary-gold)"/>
            <h3>Payment & Earning History</h3>
        </div>
        {transactions.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        <th style={{ padding: '10px' }}>DATE</th>
                        <th style={{ padding: '10px' }}>TYPE</th>
                        <th style={{ padding: '10px' }}>AMOUNT</th>
                        <th style={{ padding: '10px' }}>NOTES</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map(t => (
                        <tr key={t._id} style={{ borderTop: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                            <td style={{ padding: '12px 10px' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                            <td style={{ padding: '12px 10px' }}>
                                <span style={{ color: t.type === 'earning' ? 'var(--accent-blue)' : 'var(--success)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>
                                    {t.type}
                                </span>
                            </td>
                            <td style={{ padding: '12px 10px', fontWeight: 600 }}>
                                {t.type === 'payment' ? '-' : '+'} ₹ {t.amount?.toLocaleString()}
                            </td>
                            <td style={{ padding: '12px 10px', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {t.notes || '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '30px' }}>No transactions found.</p>}
    </div>
);

/* ──────────── Shared Components ──────────── */
const MetricCard = ({ icon, title, value, subtitle }) => (
    <div className="glass" style={{ padding: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '10px' }}>{icon}</div>
        <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{title}</p>
            <h4 style={{ fontSize: '1.4rem', margin: '2px 0' }}>{value}</h4>
            {subtitle && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>
    </div>
);

const ProgressBox = ({ label, value, color }) => (
    <div style={{ padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', borderTop: `3px solid ${color}` }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '5px' }}>{label}</p>
        <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>{value}</p>
    </div>
);

export default WorkerDetailView;
