import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { 
  ArrowLeft, Coins, Package, CreditCard, History, AlertCircle, Phone, Hammer, RotateCcw, Edit2, Plus, X, ShieldCheck, Trash2, Printer, Settings2
} from 'lucide-react';

const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
  }).split(' ').join(' - ');
};

const WorkerDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [worker, setWorker] = useState(null);
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [goldIssues, setGoldIssues] = useState([]);
  const [categories, setCategories] = useState([{ name: 'Necklace', code: 'NE' }]);
  const [companyStones, setCompanyStones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Modals Visibility
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGoldModal, setShowGoldModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);

  // Form Datas
  const [editData, setEditData] = useState({ name: '', contact: '', identityNumber: '' });
  const [goldData, setGoldData] = useState({ weight: '', purity: '22k', expectedWastage: '0', deliveryDate: '', notes: '', stones: [], totalStoneWeight: 0 });
  const [adjustmentData, setAdjustmentData] = useState({ type: 'payment', amount: '', goldAmount: '', notes: 'Manual Adjustment' });
  const [productData, setProductData] = useState({ category: '', designName: '', expectedWeight: '', stones: [], quantity: 1, totalStoneWeight: 0 });
  const [showGoldStoneDetail, setShowGoldStoneDetail] = useState(false);
  const [showProductStoneDetail, setShowProductStoneDetail] = useState(false);

  const handlePrintPassbook = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    // Using string concatenation for the inner parts to avoid template literal escaping issues
    const transactionRows = transactions.map(t => {
      return '<tr>' +
        '<td>' + formatDate(t.createdAt) + '</td>' +
        '<td>' + t.type.toUpperCase() + '</td>' +
        '<td>' + (t.notes || '') + '</td>' +
        '<td>₹ ' + t.amount.toLocaleString() + '</td>' +
      '</tr>';
    }).join('');

    const netBalance = (stats?.totalEarnings - stats?.totalPayments).toLocaleString();

    const content = `
      <html>
        <head>
          <title>Passbook - ${worker.name}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background: #f4f4f4; }
            .header { text-align: center; margin-bottom: 40px; }
            .summary { margin-top: 30px; border-top: 2px solid #000; padding-top: 15px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>WORKER TRANSACTION LEDGER</h2>
            <p><strong>Worker:</strong> ${worker.name} (${worker.workerID})</p>
            <p><strong>Date:</strong> ${formatDate(new Date())}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Notes</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${transactionRows}
            </tbody>
          </table>
          <div class="summary">
            <h3>Net Balance: ₹ ${netBalance}</h3>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  const handlePrintReceipt = (product) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    
    const stoneDetails = product.stones?.map(s => 
      `<div>• ${s.stoneName}: ${s.stoneWeight}g ${s.stoneDetails ? `(${s.stoneDetails})` : ''}</div>`
    ).join('') || 'None';

    const content = `
      <html>
        <head>
          <title>Submission Receipt - ${product.productID}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; font-size: 14px; line-height: 1.4; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
            .item-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .footer { text-align: center; border-top: 2px dashed #000; margin-top: 20px; padding-top: 10px; font-size: 12px; }
            .bold { font-weight: bold; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin:0">${worker.name}</h2>
            <div>SUBMISSION RECEIPT</div>
            <div>Date: ${formatDate(new Date())}</div>
          </div>
          <div class="bold" style="margin-bottom:10px">PRODUCT DETAILS:</div>
          <div class="item-row"><span>ID:</span> <span>${product.productID}</span></div>
          <div class="item-row"><span>Design:</span> <span>${product.designName}</span></div>
          <div class="item-row"><span>Category:</span> <span>${product.category}</span></div>
          <div class="item-row"><span>Weight:</span> <span>${product.goldWeight}g</span></div>
          <div class="item-row"><span>Status:</span> <span>${product.status.toUpperCase()}</span></div>
          
          <div class="bold" style="margin-top:15px">STONES:</div>
          <div style="font-size: 12px">${stoneDetails}</div>
          
          <div class="footer">
            <div>Authorized Signature</div>
            <div style="margin-top:40px">___________________</div>
            <p>Thank you for your craftsmanship.</p>
          </div>
          <script>window.print(); setTimeout(() => window.close(), 500);</script>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [workerRes, statsRes, transRes, productRes, goldRes, companyRes] = await Promise.all([
        api.get(`/workers/${id}`),
        api.get(`/stats/worker/${id}`),
        api.get(`/mgmt/transactions?workerId=${id}`),
        api.get(`/mgmt/products?workerId=${id}`),
        api.get(`/gold?workerId=${id}`),
        api.get(`/company`)
      ]);
      setWorker(workerRes.data);
      setStats(statsRes.data);
      setTransactions(transRes.data);
      setProducts(productRes.data || []);
      setGoldIssues(goldRes.data || []);
      
      if (companyRes.data) {
          if (companyRes.data.categories?.length > 0) {
              const activeCats = companyRes.data.categories.filter(c => c.status !== 'Inactive');
              setCategories(activeCats);
              if (activeCats.length > 0) {
                  setProductData(prev => ({...prev, category: activeCats[0].name}));
              }
          }
          if (companyRes.data.stones) {
              const activeStones = companyRes.data.stones.filter(s => s.status !== 'Inactive');
              setCompanyStones(activeStones);
          }
      }

      // Sync edit data
      setEditData({
        name: workerRes.data.name,
        contact: workerRes.data.contact || '',
        identityNumber: workerRes.data.identityNumber || ''
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/workers/${id}`, editData);
      setShowEditModal(false);
      fetchData();
    } catch (err) { alert('Error updating worker'); }
  };

  /* Gold Issue Logic */
  const handleGoldSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/gold', { ...goldData, workerId: id });
      setShowGoldModal(false);
      setGoldData({ weight: '', purity: '22k', expectedWastage: '0', deliveryDate: '', notes: '', stones: [] });
      fetchData();
    } catch (err) { alert('Error issuing gold'); }
  };

  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/mgmt/transactions', {
        ...adjustmentData,
        workerId: id,
        amount: parseFloat(adjustmentData.amount) || 0,
        goldAmount: parseFloat(adjustmentData.goldAmount) || 0
      });
      setShowAdjustmentModal(false);
      alert('Adjustment applied');
      fetchData();
    } catch (err) { alert('Error applying adjustment'); }
  };

  const addGoldStone = () => {
    setGoldData({ ...goldData, stones: [...goldData.stones, { stoneName: companyStones[0]?.stoneName || '', stoneWeight: '' }] });
  };
  const updateGoldStone = (index, field, value) => {
    const newStones = [...goldData.stones];
    newStones[index][field] = value;
    setGoldData({ ...goldData, stones: newStones });
  };
  const removeGoldStone = (index) => {
    const newStones = [...goldData.stones];
    newStones.splice(index, 1);
    setGoldData({ ...goldData, stones: newStones });
  };

  /* Product Assign Logic */
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/mgmt/products', { ...productData, workerId: id });
      setShowProductModal(false);
      setProductData({ category: categories[0]?.name || '', designName: '', expectedWeight: '', stones: [], quantity: 1 });
      fetchData();
    } catch (err) { alert('Error assigning product'); }
  };

  const addProductStone = () => {
    setProductData({ ...productData, stones: [...productData.stones, { stoneName: companyStones[0]?.stoneName || '', stoneWeight: '', stoneDetails: '' }] });
  };
  const updateProductStone = (index, field, value) => {
    const newStones = [...productData.stones];
    newStones[index][field] = value;
    setProductData({ ...productData, stones: newStones });
  };
  const removeProductStone = (index) => {
    const newStones = [...productData.stones];
    newStones.splice(index, 1);
    setProductData({ ...productData, stones: newStones });
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

      <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'start' }}>
        {/* Profile Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass" style={{ padding: '30px', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-gold)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', fontSize: '2rem', fontWeight: 'bold' }}>
                    {worker.name[0]}
                </div>
                <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '6px', background: 'rgba(212,175,55,0.15)', color: 'var(--primary-gold)', fontFamily: 'monospace', fontWeight: 600 }}>
                    {worker.workerID || 'N/A'}
                </span>
                <h3 style={{ marginTop: '10px' }}>{worker.name}</h3>

                <div style={{ marginTop: '20px', padding: '15px', background: 'var(--card-bg)', borderRadius: '12px', fontSize: '0.85rem', textAlign: 'left' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '5px' }}>Contact</p>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={14} color="var(--primary-gold)"/> {worker.contact || 'Not provided'}
                    </p>
                    <p style={{ color: 'var(--text-muted)', margin: '10px 0 5px' }}>Identity Number</p>
                    <p>{worker.identityNumber || '—'}</p>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                    <button className="glass" onClick={() => setShowEditModal(true)} style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-blue)', border: '1px solid rgba(52,152,219,0.3)' }}>
                        <Edit2 size={14}/> Edit Profile
                    </button>
                    {user?.role === 'admin' && (
                        <button className="glass" onClick={() => setShowAdjustmentModal(true)} style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--primary-gold)', border: '1px solid rgba(212,175,55,0.3)' }}>
                            <Settings2 size={14}/> Adjustments
                        </button>
                    )}
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
            <div className="responsive-grid">
                <MetricCard icon={<Coins size={20} color="var(--primary-gold)"/>} title="Gold Bal." value={`${((stats?.goldIssued || 0) - (stats?.goldReturned || 0) + (stats?.goldAdjustment || 0)).toFixed(3)}g`} />
                <MetricCard icon={<Package size={20} color="var(--accent-blue)"/>} title="Done" value={stats?.completedProducts || 0} />
                <MetricCard icon={<CreditCard size={20} color="var(--success)"/>} title="Earnings" value={`₹ ${(stats?.totalEarnings || 0).toLocaleString()}`} />
                <MetricCard icon={<Hammer size={20} color="var(--danger)"/>} title="Assigned" value={products.filter(p => p.status !== 'completed').length} />
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '5px', background: 'var(--card-bg)', padding: '4px', borderRadius: '10px' }}>
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
            {activeTab === 'products' && <ProductsTab products={products} setShowProductModal={setShowProductModal} handlePrintReceipt={handlePrintReceipt} />}
            {activeTab === 'gold' && <GoldHistoryTab goldIssues={goldIssues} setShowGoldModal={setShowGoldModal} />}
            {activeTab === 'transactions' && <TransactionsTab transactions={transactions} handlePrintPassbook={handlePrintPassbook} />}
        </div>
      </div>

      {/* MODALS */}
      {showEditModal && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div className="glass" style={{ width: '90%', maxWidth: '480px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3>Edit Worker Details</h3>
                    <X size={20} onClick={() => setShowEditModal(false)} style={{ cursor: 'pointer' }}/>
                  </div>
                  <form onSubmit={handleEditSubmit}>
                      <div className="input-group"><label>Full Name</label><input required value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} /></div>
                      <div className="input-group"><label>Contact</label><input required type="tel" value={editData.contact} onChange={e => setEditData({...editData, contact: e.target.value.replace(/\D/g, '')})} pattern="[0-9]{10}" maxLength={10} title="Mobile number must be exactly 10 digits" /></div>
                      <div className="input-group"><label>Identity Proof Number</label><input value={editData.identityNumber} onChange={e => setEditData({...editData, identityNumber: e.target.value})} /></div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                          <button type="button" className="glass" onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '12px', color: 'var(--text-main)' }}>Cancel</button>
                          <button type="submit" className="btn-primary" style={{ flex: 1 }}>Update</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {showAdjustmentModal && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div className="glass" style={{ width: '90%', maxWidth: '480px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 className="gold-gradient">History Adjustment</h3>
                    <X size={20} onClick={() => setShowAdjustmentModal(false)} style={{ cursor: 'pointer' }}/>
                  </div>
                  <form onSubmit={handleAdjustmentSubmit}>
                      <div className="input-group">
                          <label>Adjustment Type</label>
                          <select value={adjustmentData.type} onChange={e => setAdjustmentData({...adjustmentData, type: e.target.value})} style={{ width: '100%', background: 'var(--surface-bg)', color: 'var(--text-main)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                              <option value="payment">Debit (Give/Subtract from worker)</option>
                              <option value="earning">Credit (Add to worker balance)</option>
                          </select>
                      </div>
                      <div className="responsive-grid" style={{ gap: '15px' }}>
                          <div className="input-group"><label>Cash Amount (₹)</label><input type="number" value={adjustmentData.amount} onChange={e => setAdjustmentData({...adjustmentData, amount: e.target.value})} placeholder="0" /></div>
                          <div className="input-group"><label>Gold Weight (g)</label><input type="number" step="0.001" value={adjustmentData.goldAmount} onChange={e => setAdjustmentData({...adjustmentData, goldAmount: e.target.value})} placeholder="0.000" /></div>
                      </div>
                      <div className="input-group"><label>Notes / Reason</label><input required value={adjustmentData.notes} onChange={e => setAdjustmentData({...adjustmentData, notes: e.target.value})} /></div>
                      
                      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                          <button type="button" className="glass" onClick={() => setShowAdjustmentModal(false)} style={{ flex: 1, padding: '12px', color: 'var(--text-main)' }}>Cancel</button>
                          <button type="submit" className="btn-primary" style={{ flex: 1 }}>Apply Adjustment</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {showGoldModal && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div className="glass" style={{ width: '90%', maxWidth: '600px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 className="gold-gradient">Issue Material to {worker.name}</h3>
                    <X size={20} onClick={() => setShowGoldModal(false)} style={{ cursor: 'pointer' }}/>
                  </div>
                  <form onSubmit={handleGoldSubmit}>
                      <div className="responsive-grid" style={{ gap: '15px' }}>
                          <div className="input-group"><label>Gold Weight (g)</label><input required type="number" step="0.01" value={goldData.weight} onChange={e => setGoldData({...goldData, weight: e.target.value})} /></div>
                          <div className="input-group">
                              <label>Purity</label>
                              <select value={goldData.purity} onChange={e => setGoldData({...goldData, purity: e.target.value})} style={{ width: '100%', background: 'var(--surface-bg)', color: 'var(--text-main)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                  <option value="22k">22k</option>
                                  <option value="24k">24k</option>
                              </select>
                          </div>
                      </div>
                      
                      <div className="input-group">
                          <label>Total Stone Weight (Gross)</label>
                          <input type="number" step="0.01" value={goldData.totalStoneWeight} onChange={e => setGoldData({...goldData, totalStoneWeight: e.target.value})} placeholder="0.00" />
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <button type="button" onClick={() => setShowGoldStoneDetail(!showGoldStoneDetail)} style={{ background: 'transparent', border: 'none', color: 'var(--primary-gold)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
                           {showGoldStoneDetail ? '▼ Hide Detailed Stones' : '▶ Add Detailed Stones (Optional)'}
                        </button>
                        
                        {showGoldStoneDetail && (
                            <div style={{ padding: '15px', background: 'var(--card-bg)', borderRadius: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <label style={{ margin: 0, fontWeight: 600, fontSize: '0.8rem' }}>Stone Manifest</label>
                                    <button type="button" onClick={addGoldStone} style={{ background: 'transparent', border: '1px solid var(--primary-gold)', color: 'var(--primary-gold)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>+ Add Row</button>
                                </div>
                                {goldData.stones.map((stone, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                                    <div style={{ flex: 2, position: 'relative' }}>
                                        <input 
                                            list={`gold-stone-list-${idx}`}
                                            placeholder="Stone Name"
                                            value={stone.stoneName} 
                                            onChange={e => updateGoldStone(idx, 'stoneName', e.target.value)}
                                            style={{ width: '100%', padding: '10px', borderRadius: '4px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}
                                        />
                                        <datalist id={`gold-stone-list-${idx}`}>
                                            {companyStones.map(cs => <option key={cs.stoneName} value={cs.stoneName}>{cs.stoneName}</option>)}
                                        </datalist>
                                    </div>
                                    <input type="number" step="0.01" required placeholder="Wt" value={stone.stoneWeight} onChange={e => updateGoldStone(idx, 'stoneWeight', e.target.value)} style={{ flex: 1, padding: '10px' }} />
                                    <Trash2 size={16} onClick={() => removeGoldStone(idx)} color="var(--danger)" style={{ cursor: 'pointer' }} />
                                </div>
                                ))}
                            </div>
                        )}
                      </div>

                      <div className="responsive-grid" style={{ gap: '15px' }}>
                          <div className="input-group"><label>Expected Wastage %</label><input type="number" step="0.1" value={goldData.expectedWastage} onChange={e => setGoldData({...goldData, expectedWastage: e.target.value})} /></div>
                          <div className="input-group"><label>Due Date</label><input type="date" value={goldData.deliveryDate} onChange={e => setGoldData({...goldData, deliveryDate: e.target.value})} /></div>
                      </div>
                      <div className="input-group">
                        <label>Notes (Optional)</label>
                        <textarea value={goldData.notes} onChange={e => setGoldData({...goldData, notes: e.target.value})} style={{ width: '100%', background: 'var(--surface-bg)', color: 'var(--text-main)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', minHeight: '60px' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                          <button type="button" className="glass" onClick={() => setShowGoldModal(false)} style={{ flex: 1, padding: '12px', color: 'var(--text-main)' }}>Cancel</button>
                          <button type="submit" className="btn-primary" style={{ flex: 1 }}>Issue Material</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {showProductModal && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div className="glass" style={{ width: '90%', maxWidth: '600px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 className="gold-gradient">Assign New Product</h3>
                    <X size={20} onClick={() => setShowProductModal(false)} style={{ cursor: 'pointer' }}/>
                  </div>
                  <form onSubmit={handleProductSubmit}>
                      <div className="input-group">
                          <label>Category</label>
                          <select 
                            value={productData.category} 
                            onChange={e => setProductData({ ...productData, category: e.target.value })} 
                            style={{ width: '100%', background: 'var(--surface-bg)', color: 'var(--text-main)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                          >
                              {categories.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                          </select>
                      </div>
                      <div className="input-group">
                          <label>Product ID</label>
                          <input readOnly placeholder="System will generate exact ID via sequence..." style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-muted)', fontStyle: 'italic' }} />
                      </div>
                      <div className="input-group"><label>Design Name</label><input required value={productData.designName} onChange={e => setProductData({...productData, designName: e.target.value})} /></div>
                      <div className="responsive-grid" style={{ gap: '15px' }}>
                          <div className="input-group"><label>Expected Weight (g)</label><input type="number" step="0.01" value={productData.expectedWeight} onChange={e => setProductData({...productData, expectedWeight: e.target.value})} /></div>
                          <div className="input-group"><label>Order Quantity</label><input type="number" min="1" value={productData.quantity} onChange={e => setProductData({...productData, quantity: e.target.value})} /></div>
                      </div>
                      
                      <div className="input-group">
                          <label>Total Stone Weight (Gross)</label>
                          <input type="number" step="0.01" value={productData.totalStoneWeight} onChange={e => setProductData({...productData, totalStoneWeight: e.target.value})} placeholder="0.00" />
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <button type="button" onClick={() => setShowProductStoneDetail(!showProductStoneDetail)} style={{ background: 'transparent', border: 'none', color: 'var(--primary-gold)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
                           {showProductStoneDetail ? '▼ Hide Detailed Stones' : '▶ Add Detailed Stones (Optional)'}
                        </button>
                        
                        {showProductStoneDetail && (
                            <div style={{ padding: '15px', background: 'var(--card-bg)', borderRadius: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <label style={{ margin: 0, fontWeight: 600, fontSize: '0.8rem' }}>Stone Manifest</label>
                                    <button type="button" onClick={addProductStone} style={{ background: 'transparent', border: '1px solid var(--primary-gold)', color: 'var(--primary-gold)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>+ Add Row</button>
                                </div>
                                {productData.stones.map((stone, idx) => (
                                   <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                                      <div style={{ flex: 2, position: 'relative' }}>
                                        <input 
                                          list={`prod-stone-list-${idx}`}
                                          placeholder="Stone Name"
                                          value={stone.stoneName} 
                                          onChange={e => updateProductStone(idx, 'stoneName', e.target.value)}
                                          style={{ width: '100%', padding: '10px', borderRadius: '4px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}
                                        />
                                        <datalist id={`prod-stone-list-${idx}`}>
                                          {companyStones.map(cs => <option key={cs.stoneName} value={cs.stoneName}>{cs.stoneName}</option>)}
                                        </datalist>
                                      </div>
                                      <input type="number" step="0.01" required placeholder="Wt" value={stone.stoneWeight} onChange={e => updateProductStone(idx, 'stoneWeight', e.target.value)} style={{ flex: 1, padding: '10px' }} />
                                      <input type="text" placeholder="Details" value={stone.stoneDetails} onChange={e => updateProductStone(idx, 'stoneDetails', e.target.value)} style={{ flex: 2, padding: '10px' }} />
                                      <Trash2 size={16} onClick={() => removeProductStone(idx)} color="var(--danger)" style={{ cursor: 'pointer' }} />
                                   </div>
                                ))}
                            </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                          <button type="button" className="glass" onClick={() => setShowProductModal(false)} style={{ flex: 1, padding: '12px', color: 'var(--text-main)' }}>Cancel</button>
                          <button type="submit" className="btn-primary" style={{ flex: 1 }}>Assign Product</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
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
            <div className="responsive-grid" style={{ gap: '15px' }}>
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
                    <span style={{ color: 'var(--text-muted)' }}>{formatDate(g.createdAt)}</span>
                </div>
            )) : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No gold requests yet.</p>}
        </div>
    </div>
);

/* ──────────── TAB: Products ──────────── */
const ProductsTab = ({ products, setShowProductModal, handlePrintReceipt }) => (
        <div className="glass" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Hammer size={18} color="var(--primary-gold)"/>
                    <h3>Products Made & Returned</h3>
                </div>
                <button 
                    className="btn-primary" 
                    onClick={() => setShowProductModal(true)}
                    style={{ fontSize: '0.8rem', padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    <Plus size={16}/> New Product
                </button>
            </div>
        {products.length > 0 ? (
            <div className="table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
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
                            <td style={{ padding: '12px 10px' }}>{p.goldWeight || p.expectedWeight}g</td>
                            <td style={{ padding: '12px 10px' }}>
                                <span style={{ 
                                    padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                                    background: p.status === 'completed' ? 'rgba(46,204,113,0.1)' : 'rgba(212,175,55,0.1)',
                                    color: p.status === 'completed' ? 'var(--success)' : 'var(--primary-gold)'
                                }}>
                                    {p.status}
                                </span>
                            </td>
                            <td style={{ padding: '12px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{formatDate(p.createdAt)}</span>
                                <button 
                                    onClick={() => handlePrintReceipt(p)}
                                    style={{ border: 'none', background: 'transparent', color: 'var(--primary-gold)', cursor: 'pointer', padding: '4px' }}
                                    title="Print Submission Receipt"
                                >
                                    <Printer size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
        ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '30px' }}>No products assigned to this worker yet.</p>}
    </div>
);

/* ──────────── TAB: Gold History ──────────── */
const GoldHistoryTab = ({ goldIssues, setShowGoldModal }) => (
    <div className="glass" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <RotateCcw size={18} color="var(--primary-gold)"/>
                <h3>Gold Issue & Return History</h3>
            </div>
            <button 
                className="btn-primary" 
                onClick={() => setShowGoldModal(true)}
                style={{ fontSize: '0.8rem', padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
                <Plus size={16}/> Issue Gold
            </button>
        </div>
        {goldIssues.length > 0 ? (
            <div className="table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        <th style={{ padding: '10px' }}>DATE</th>
                        <th style={{ padding: '10px' }}>WEIGHT</th>
                        <th style={{ padding: '10px' }}>STONES</th>
                        <th style={{ padding: '10px' }}>STATUS</th>
                        <th style={{ padding: '10px' }}>NOTES</th>
                    </tr>
                </thead>
                <tbody>
                    {goldIssues.map(g => (
                        <tr key={g._id} style={{ borderTop: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                            <td style={{ padding: '12px 10px' }}>{formatDate(g.createdAt)}</td>
                            <td style={{ padding: '12px 10px', fontWeight: 600 }}>{g.weight}g ({g.purity})</td>
                            <td style={{ padding: '12px 10px' }}>{g.stones?.length || 0} attached</td>
                            <td style={{ padding: '12px 10px' }}>
                                <span style={{ 
                                    padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                                    background: g.status === 'completed' ? 'rgba(46,204,113,0.1)' : 'rgba(212,175,55,0.1)',
                                    color: g.status === 'completed' ? 'var(--success)' : 'var(--primary-gold)'
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
            </div>
        ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '30px' }}>No gold issue records found.</p>}
    </div>
);

/* ──────────── TAB: Transactions ──────────── */
const TransactionsTab = ({ transactions, handlePrintPassbook }) => (
    <div className="glass" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <History size={18} color="var(--primary-gold)"/>
                <h3>Payment & Earning History</h3>
            </div>
            <button onClick={handlePrintPassbook} className="glass" style={{ padding: '8px 15px', color: 'var(--primary-gold)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <Printer size={16}/> Print Ledger
            </button>
        </div>
        {transactions.length > 0 ? (
            <div className="table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
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
                            <td style={{ padding: '12px 10px' }}>{formatDate(t.createdAt)}</td>
                            <td style={{ padding: '12px 10px' }}>
                                <span style={{ color: t.type === 'earning' ? 'var(--accent-blue)' : 'var(--success)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>
                                    {t.type}
                                </span>
                            </td>
                            <td style={{ padding: '12px 10px', fontWeight: 600 }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span>{t.type === 'payment' ? '-' : '+'} ₹ {t.amount?.toLocaleString()}</span>
                                    {t.goldAmount !== 0 && (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--primary-gold)' }}>
                                            {t.goldAmount > 0 ? '+' : ''}{t.goldAmount}g Gold
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td style={{ padding: '12px 10px', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {t.notes || '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
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
    <div style={{ padding: '15px', background: 'var(--card-bg)', borderRadius: '12px', borderTop: `3px solid ${color}` }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '5px' }}>{label}</p>
        <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>{value}</p>
    </div>
);

export default WorkerDetailView;
