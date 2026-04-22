import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, CheckCircle, Clock, Package, ShieldCheck, ChevronRight, Trash2, LayoutGrid, List, Search, X, Tag } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [categories, setCategories] = useState([{ name: 'Necklace', code: 'NE' }]);
  const [companyStones, setCompanyStones] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [purityStandards, setPurityStandards] = useState([{label: '22k', value: '91.6'}]);
  
  const [newProductData, setNewProductData] = useState({
    category: '', designName: '', expectedWeight: '', workerId: '', stones: [], quantity: 1, totalStoneWeight: 0, purity: '22k'
  });
  const [showStoneDetail, setShowStoneDetail] = useState(false);

  const [receiveData, setReceiveData] = useState({
    grossWeight: '', netWeight: '', actualWastage: '', qualityCheck: 'passed'
  });

  useEffect(() => {
    fetchProducts();
    fetchWorkers();
    fetchCompanyData();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/mgmt/products');
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWorkers = async () => {
    try {
      const { data } = await api.get('/workers');
      setWorkers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCompanyData = async () => {
    try {
      const { data } = await api.get('/company');
      if (data) {
          if (data.categories?.length > 0) {
              setCategories(data.categories);
              setNewProductData(prev => ({...prev, category: data.categories[0].name}));
          }
          if (data.stones) setCompanyStones(data.stones);
          if (data.purityStandards?.length > 0) {
              setPurityStandards(data.purityStandards);
              setNewProductData(prev => ({...prev, purity: data.purityStandards[0].label}));
          }
      }
    } catch (err) {
      console.error('Error fetching company data:', err);
    }
  };

  const addStone = () => {
    setNewProductData({ ...newProductData, stones: [...newProductData.stones, { stoneName: '', stoneWeight: '', stoneDetails: '' }] });
  };

  const updateStone = (index, field, value) => {
    const newStones = [...newProductData.stones];
    newStones[index][field] = value;
    setNewProductData({ ...newProductData, stones: newStones });
  };

  const removeStone = (index) => {
    const newStones = [...newProductData.stones];
    newStones.splice(index, 1);
    setNewProductData({ ...newProductData, stones: newStones });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/mgmt/products', newProductData);
      setShowCreateModal(false);
      setNewProductData({ category: categories[0]?.name || '', designName: '', expectedWeight: '', workerId: '', stones: [], quantity: 1 });
      fetchProducts();
    } catch (err) {
       alert('Error creating product: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReceive = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/mgmt/products/${selectedProduct._id}/receive`, receiveData);
      
      if (window.confirm('Product received successfully! Would you like to print the individual QR tag now?')) {
        window.open(`/print-qr?ids=${selectedProduct.productId}`, '_blank');
      }

      setShowReceiveModal(false);
      setSelectedProduct(null);
      setReceiveData({ grossWeight: '', netWeight: '', actualWastage: '', qualityCheck: 'passed' });
      fetchProducts();
    } catch (err) {
      alert('Error receiving product');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'rgba(255, 183, 178, 0.2)', color: '#FF9AA2', icon: <Clock size={14}/> },
      'in-progress': { bg: 'rgba(160, 196, 255, 0.2)', color: '#A0C4FF', icon: <Package size={14}/> },
      completed: { bg: 'rgba(202, 255, 191, 0.2)', color: '#2ecc71', icon: <CheckCircle size={14}/> }
    };
    const style = styles[status] || styles.pending;
    return (
      <span style={{ 
        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', 
        borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: style.bg, color: style.color, border: `1px solid ${style.color}33`
      }}>
        {style.icon} {status.toUpperCase()}
      </span>
    );
  };

  const filteredProducts = products.filter(p => 
    p.designName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.productId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.workerId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glass" style={{ padding: '24px', background: 'var(--surface-bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 className="gold-gradient" style={{ fontSize: '1.8rem' }}>PRODUCTION FLOW</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Monitor ongoing works and quality checks</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ display: 'flex', background: 'var(--dark-bg)', padding: '4px', borderRadius: '10px' }}>
                <button 
                    onClick={() => setViewMode('grid')} 
                    style={{ padding: '8px', background: viewMode === 'grid' ? 'var(--surface-bg)' : 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: viewMode === 'grid' ? 'var(--primary-gold)' : 'var(--text-muted)', boxShadow: viewMode === 'grid' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                >
                    <LayoutGrid size={20} />
                </button>
                <button 
                    onClick={() => setViewMode('list')} 
                    style={{ padding: '8px', background: viewMode === 'list' ? 'var(--surface-bg)' : 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: viewMode === 'list' ? 'var(--primary-gold)' : 'var(--text-muted)', boxShadow: viewMode === 'list' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                >
                    <List size={20} />
                </button>
            </div>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '10px' }}>
                <Plus size={18} /> New Assignment
            </button>
        </div>
      </div>

      <div style={{ marginBottom: '25px', position: 'relative' }}>
        <Search style={{ position: 'absolute', left: '15px', top: '15px', color: 'var(--text-muted)' }} size={20}/>
        <input 
            type="text" 
            placeholder="Search products by ID, design or craftsman..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '15px 15px 15px 50px', background: 'var(--dark-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-main)' }}
        />
      </div>

      {viewMode === 'grid' ? (
        <div className="responsive-grid">
            {filteredProducts.map(product => (
            <div key={product._id} className="glass" style={{ padding: '20px', borderLeft: `5px solid ${product.status === 'completed' ? 'var(--success)' : (product.status === 'in-progress' ? 'var(--accent-blue)' : 'var(--primary-gold)')}`, background: 'var(--surface-bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>{product.productId}</span>
                    <h3 style={{ fontSize: '1.25rem', margin: '4px 0' }}>{product.designName}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{product.category}</p>
                </div>
                {getStatusBadge(product.status)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '20px 0', padding: '15px', background: 'var(--dark-bg)', borderRadius: '12px' }}>
                <div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>CRAFTSMAN</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{product.workerId?.name || 'Unassigned'}</p>
                </div>
                <div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>EST. WEIGHT</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{product.expectedWeight}g</p>
                </div>
                </div>

                {product.status === 'completed' ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <ShieldCheck size={16} /> QC PASSED
                    </div>
                    <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>FINAL WEIGHT</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{product.netWeight}g <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-gold)' }}>({product.purity})</span></p>
                    </div>
                </div>
                ) : (
                <button 
                    className="glass" 
                    onClick={() => { setSelectedProduct(product); setShowReceiveModal(true); }}
                    style={{ width: '100%', padding: '12px', color: 'var(--primary-gold)', border: '1px solid var(--primary-gold)', marginTop: '5px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600, transition: 'var(--transition)' }}
                >
                    Receive Work <ChevronRight size={18} />
                </button>
                )}
            </div>
            ))}
        </div>
      ) : (
        <div className="glass" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ textAlign: 'left', background: 'var(--dark-bg)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <th style={{ padding: '15px' }}>ID & Design</th>
                        <th style={{ padding: '15px' }}>Craftsman</th>
                        <th style={{ padding: '15px' }}>Status</th>
                        <th style={{ padding: '15px' }}>Weight (Est/Net)</th>
                        <th style={{ padding: '15px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProducts.map(product => (
                        <tr key={product._id} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>
                            <td style={{ padding: '15px' }}>
                                <div style={{ fontWeight: 600 }}>{product.designName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{product.productId}</div>
                            </td>
                            <td style={{ padding: '15px' }}>{product.workerId?.name}</td>
                            <td style={{ padding: '15px' }}>{getStatusBadge(product.status)}</td>
                            <td style={{ padding: '15px' }}>
                                {product.status === 'completed' ? <strong>{product.netWeight}g</strong> : <span style={{ color: 'var(--text-muted)' }}>{product.expectedWeight}g (Est)</span>}
                            </td>
                            <td style={{ padding: '15px' }}>
                                {product.status !== 'completed' && (
                                    <button onClick={() => { setSelectedProduct(product); setShowReceiveModal(true); }} className="glass" style={{ padding: '6px 12px', color: 'var(--primary-gold)', fontSize: '0.8rem', fontWeight: 600 }}>Receive</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
          <Package size={50} style={{ opacity: 0.1, marginBottom: '20px' }}/>
          <p>No products match the filter.</p>
        </div>
      )}

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ width: '90%', maxWidth: '650px', padding: '30px', maxHeight: '95vh', overflowY: 'auto', background: 'var(--surface-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h3 style={{ margin: 0, fontSize: '1.5rem' }} className="gold-gradient">Initialize New Production</h3>
                <X onClick={() => setShowCreateModal(false)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }}/>
            </div>
            
            <form onSubmit={handleCreate}>
              <div className="responsive-grid" style={{ gap: '20px' }}>
                <div className="input-group">
                  <label>Category</label>
                  <select 
                    value={newProductData.category} 
                    onChange={e => setNewProductData({...newProductData, category: e.target.value})} 
                    style={{ background: 'var(--dark-bg)' }}
                  >
                    {categories.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Expected Weight (g)</label>
                  <input type="number" step="0.01" value={newProductData.expectedWeight} onChange={e => setNewProductData({...newProductData, expectedWeight: e.target.value})} style={{ background: 'var(--dark-bg)' }} />
                </div>
                <div className="input-group">
                  <label>Purity Standard</label>
                  <select 
                    value={newProductData.purity} 
                    onChange={e => setNewProductData({...newProductData, purity: e.target.value})} 
                    style={{ background: 'var(--dark-bg)' }}
                  >
                    {purityStandards.map(ps => <option key={ps.label} value={ps.label}>{ps.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="responsive-grid" style={{ gap: '20px' }}>
                  <div className="input-group" style={{ flex: 2 }}>
                    <label>Design Name</label>
                    <input required value={newProductData.designName} onChange={e => setNewProductData({...newProductData, designName: e.target.value})} style={{ background: 'var(--dark-bg)' }} />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label>Bulk Quantity</label>
                    <input type="number" min="1" value={newProductData.quantity} onChange={e => setNewProductData({...newProductData, quantity: e.target.value})} style={{ background: 'var(--dark-bg)' }} />
                  </div>
              </div>

              <div className="input-group">
                <label>Assign to Craftsman</label>
                <select 
                    required 
                    value={newProductData.workerId} 
                    onChange={e => setNewProductData({...newProductData, workerId: e.target.value})} 
                    style={{ background: 'var(--dark-bg)' }}
                >
                  <option value="">Select Worker...</option>
                  {workers.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label>Total Stone Weight (Gross)</label>
                <input type="number" step="0.01" value={newProductData.totalStoneWeight} onChange={e => setNewProductData({...newProductData, totalStoneWeight: e.target.value})} style={{ background: 'var(--dark-bg)' }} placeholder="0.00" />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <button type="button" onClick={() => setShowStoneDetail(!showStoneDetail)} style={{ background: 'transparent', border: 'none', color: 'var(--primary-gold)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
                   {showStoneDetail ? '▼ Hide Detailed Stones' : '▶ Add Detailed Stones (Optional)'}
                </button>
                
                {showStoneDetail && (
                    <div style={{ padding: '20px', background: 'var(--dark-bg)', borderRadius: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <label style={{ margin: 0, fontWeight: 700, color: 'var(--primary-gold)', fontSize: '0.8rem' }}>STONE MANIFEST</label>
                        <button type="button" onClick={addStone} style={{ background: 'var(--surface-bg)', border: '1px solid var(--primary-gold)', color: 'var(--primary-gold)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>+ Add Item</button>
                        </div>
                        
                        <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '5px' }}>
                            {newProductData.stones.map((stone, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px', background: 'var(--surface-bg)', padding: '12px', borderRadius: '10px' }}>
                                <div style={{ flex: 2, position: 'relative' }}>
                                    <input 
                                        list={`stone-list-${idx}`}
                                        placeholder="Stone Type"
                                        value={stone.stoneName} 
                                        onChange={e => updateStone(idx, 'stoneName', e.target.value)}
                                        style={{ width: '100%', padding: '8px', border: '1px solid var(--glass-border)', borderRadius: '6px', background: 'var(--surface-bg)', color: 'var(--text-main)' }}
                                    />
                                    <datalist id={`stone-list-${idx}`}>
                                        {companyStones.map(cs => <option key={cs.stoneName} value={cs.stoneName}>{cs.stoneName}</option>)}
                                    </datalist>
                                </div>
                                <input type="number" step="0.01" required placeholder="Weight" value={stone.stoneWeight} onChange={e => updateStone(idx, 'stoneWeight', e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid var(--glass-border)', borderRadius: '6px', background: 'var(--surface-bg)', color: 'var(--text-main)' }} />
                                <Trash2 size={18} onClick={() => removeStone(idx)} color="var(--danger)" style={{ cursor: 'pointer' }} />
                            </div>
                            ))}
                        </div>
                    </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="button" className="glass" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '10px' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, borderRadius: '10px' }}>Create Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Product Modal */}
      {showReceiveModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ width: '90%', maxWidth: '550px', padding: '30px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Receive Final Production</h3>
                <X onClick={() => setShowReceiveModal(false)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }}/>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '25px', fontSize: '0.95rem' }}>Finalizing weights for <strong>{selectedProduct?.designName}</strong></p>
            
            <form onSubmit={handleReceive}>
              <div className="responsive-grid" style={{ gap: '20px', marginBottom: '20px' }}>
                <div className="input-group">
                  <label>Gross Weight (Received)</label>
                  <input required type="number" step="0.01" value={receiveData.grossWeight} onChange={e => setReceiveData({...receiveData, grossWeight: e.target.value})} style={{ background: 'var(--dark-bg)' }} />
                </div>
                <div className="input-group">
                  <label>Net Weight (Metal Only)</label>
                  <input required type="number" step="0.01" value={receiveData.netWeight} onChange={e => setReceiveData({...receiveData, netWeight: e.target.value})} style={{ background: 'var(--dark-bg)' }} />
                </div>
              </div>
              <div className="responsive-grid" style={{ gap: '20px' }}>
                <div className="input-group">
                  <label>Total Actual Wastage (g)</label>
                  <input required type="number" step="0.001" value={receiveData.actualWastage} onChange={e => setReceiveData({...receiveData, actualWastage: e.target.value})} style={{ background: 'var(--dark-bg)' }} />
                </div>
                <div className="input-group">
                  <label>Final QC Status</label>
                  <select value={receiveData.qualityCheck} onChange={e => setReceiveData({...receiveData, qualityCheck: e.target.value})} style={{ background: 'var(--dark-bg)', fontWeight: 600 }}>
                    <option value="passed">Passed ✅</option>
                    <option value="failed">Failed ❌</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <button type="button" className="glass" onClick={() => setShowReceiveModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '10px' }}>Discard</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, borderRadius: '10px' }}>Complete Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
