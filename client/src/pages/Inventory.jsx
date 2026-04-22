import React, { useState, useEffect } from 'react';
import api from '../api';
import { Package, ShieldCheck, Search, Download, Printer, X, Tag, LayoutGrid, List, Edit2, Trash2, Eye } from 'lucide-react';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // View & Modal State
  const [viewMode, setViewMode] = useState('grid');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({ designName: '', netWeight: '', stones: [] });
  const [goldRate, setGoldRate] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productRes, companyRes, settingsRes] = await Promise.all([
          api.get('/mgmt/products'),
          api.get('/company'),
          api.get('/settings')
      ]);
      setProducts(productRes.data.filter(p => p.status === 'completed'));
      if (companyRes.data) setCompanySettings(companyRes.data);
      if (settingsRes.data) {
          const sObj = settingsRes.data.reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {});
          setGoldRate(parseFloat(sObj.goldRate) || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (product) => {
      localStorage.setItem('printProduct', JSON.stringify(product));
      window.open('/print-qr', '_blank');
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setEditFormData({
        designName: product.designName,
        netWeight: product.netWeight,
        stones: product.stones || []
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
        await api.put(`/mgmt/products/${editingProduct._id}`, editFormData);
        setEditingProduct(null);
        fetchData();
        alert('Product updated successfully');
    } catch (err) {
        alert('Error updating product');
    }
  };

  const updateEditStone = (index, field, value) => {
    const newStones = [...editFormData.stones];
    newStones[index][field] = value;
    setEditFormData({ ...editFormData, stones: newStones });
  };

  const filtered = products.filter(p => 
    p.designName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.productId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.workerId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotalStoneWeight = (stones) => {
      if (!stones || stones.length === 0) return 0;
      return stones.reduce((acc, current) => acc + (parseFloat(current.stoneWeight) || 0), 0);
  };

  if (loading) return <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>Loading inventory...</div>;

  return (
    <div className="glass" style={{ padding: '24px', background: 'var(--surface-bg)' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 className="gold-gradient" style={{ fontSize: '1.8rem' }}>INVENTORY</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ready stock and completed jewellery items</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
             <div style={{ display: 'flex', background: 'var(--dark-bg)', padding: '4px', borderRadius: '10px' }}>
                <button 
                    onClick={() => setViewMode('grid')} 
                    style={{ padding: '8px', background: viewMode === 'grid' ? 'var(--surface-bg)' : 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: viewMode === 'grid' ? 'var(--primary-gold)' : 'var(--text-muted)', boxShadow: viewMode === 'grid' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'var(--transition)' }}
                >
                    <LayoutGrid size={20} />
                </button>
                <button 
                    onClick={() => setViewMode('list')} 
                    style={{ padding: '8px', background: viewMode === 'list' ? 'var(--surface-bg)' : 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: viewMode === 'list' ? 'var(--primary-gold)' : 'var(--text-muted)', boxShadow: viewMode === 'list' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'var(--transition)' }}
                >
                    <List size={20} />
                </button>
            </div>
            <button className="glass" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', border: '1px solid var(--success)', padding: '10px 20px', borderRadius: '10px', fontWeight: 600 }}>
                <Download size={18} /> Export
            </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="responsive-grid" style={{ marginBottom: '30px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="glass" style={{ padding: '20px', background: 'var(--dark-bg)' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL STOCK WEIGHT</p>
              <h3 style={{ margin: '5px 0 0', fontSize: '1.5rem' }}>{products.reduce((acc, p) => acc + (p.netWeight || 0), 0).toFixed(2)}g</h3>
          </div>
          <div className="glass" style={{ padding: '20px', background: 'var(--dark-bg)' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>ESTIMATED ASSET VALUE</p>
              <h3 style={{ margin: '5px 0 0', fontSize: '1.5rem', color: 'var(--primary-gold)' }}>{companySettings?.currency || '₹'} {(products.reduce((acc, p) => acc + (p.netWeight || 0), 0) * goldRate).toLocaleString()}</h3>
          </div>
          <div className="glass" style={{ padding: '20px', background: 'var(--dark-bg)' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>ITEM COUNT</p>
              <h3 style={{ margin: '5px 0 0', fontSize: '1.5rem' }}>{products.length} Units</h3>
          </div>
      </div>

      <div className="no-print" style={{ marginBottom: '25px', position: 'relative' }}>
        <Search style={{ position: 'absolute', left: '15px', top: '15px', color: 'var(--text-muted)' }} size={20}/>
        <input 
            type="text" 
            placeholder="Search inventory by ID, design or worker..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '15px 15px 15px 50px', background: 'var(--dark-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-main)', fontSize: '1rem' }}
        />
      </div>

      {viewMode === 'grid' ? (
        <div className="responsive-grid no-print">
            {filtered.map(product => (
            <div key={product._id} className="glass" style={{ padding: '20px', borderTop: '5px solid var(--success)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>{product.productId}</span>
                        <h3 style={{ fontSize: '1.25rem', margin: '4px 0' }}>{product.designName}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{product.category}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(202, 255, 191, 0.2)', padding: '4px 8px', borderRadius: '20px' }}>
                            <ShieldCheck size={16} /> <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>QC OK</span>
                        </div>
                        <button onClick={() => handleEditClick(product)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '5px' }}>
                            <Edit2 size={16} />
                        </button>
                    </div>
                </div>

                <div style={{ background: 'var(--dark-bg)', borderRadius: '12px', padding: '15px', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Craftsman</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{product.workerId?.name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net Weight</span>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>{product.netWeight}g</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stones</span>
                        <span style={{ fontSize: '0.85rem' }}>{product.stones?.length || 0} items</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={() => setSelectedProduct(product)}
                        className="glass" 
                        style={{ flex: 2, padding: '10px', fontSize: '0.85rem', color: 'var(--secondary-gold)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <Eye size={16}/> Details
                    </button>
                    <button 
                        onClick={() => handlePrint(product)}
                        className="glass" 
                        style={{ flex: 1, padding: '10px', fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'var(--transition)' }}
                        title="Print QR"
                    >
                        <Printer size={18} />
                    </button>
                </div>
            </div>
            ))}
        </div>
      ) : (
        <div className="glass no-print" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ textAlign: 'left', background: 'var(--dark-bg)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <th style={{ padding: '18px' }}>Product Information</th>
                        <th style={{ padding: '18px' }}>Category</th>
                        <th style={{ padding: '18px' }}>Weight</th>
                        <th style={{ padding: '18px' }}>Worker</th>
                        <th style={{ padding: '18px' }}>Finishing Date</th>
                        <th style={{ padding: '18px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map(product => (
                        <tr key={product._id} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem', transition: 'var(--transition)' }}>
                            <td style={{ padding: '18px' }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{product.designName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{product.productId}</div>
                            </td>
                            <td style={{ padding: '18px' }}>
                                <span style={{ background: 'var(--dark-bg)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem' }}>{product.category}</span>
                            </td>
                            <td style={{ padding: '18px', fontWeight: 700 }}>{product.netWeight}g</td>
                            <td style={{ padding: '18px' }}>{product.workerId?.name}</td>
                            <td style={{ padding: '18px', color: 'var(--text-muted)' }}>{new Date(product.updatedAt).toLocaleDateString()}</td>
                            <td style={{ padding: '18px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => setSelectedProduct(product)} className="glass" style={{ padding: '6px', color: 'var(--secondary-gold)' }} title="View details"><Eye size={18}/></button>
                                    <button onClick={() => handleEditClick(product)} className="glass" style={{ padding: '6px', color: 'var(--text-muted)' }} title="Edit"><Edit2 size={18}/></button>
                                    <button onClick={() => handlePrint(product)} className="glass" style={{ padding: '6px', color: 'var(--text-main)' }} title="Print"><Printer size={18}/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="no-print" style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
          <Package size={64} style={{ marginBottom: '20px', opacity: 0.1 }} />
          <h3 style={{ fontWeight: 400 }}>No matching inventory found</h3>
          <p style={{ fontSize: '0.9rem' }}>Try searching by different keywords or worker names</p>
        </div>
      )}

      {/* --- DETAILS MODAL --- */}
      {selectedProduct && (
          <div className="modal-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div className="glass" style={{ width: '90%', maxWidth: '650px', padding: '30px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface-bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Tag size={24} color="var(--primary-gold)"/>
                          <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Product Details</h3>
                      </div>
                      <X size={24} onClick={() => setSelectedProduct(null)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }}/>
                  </div>

                  <div style={{ textAlign: 'center', marginBottom: '30px', padding: '20px', background: 'var(--dark-bg)', borderRadius: '16px' }}>
                      <p style={{ color: 'var(--primary-gold)', fontSize: '0.75rem', letterSpacing: '2px', fontWeight: 700 }}>{selectedProduct.productId}</p>
                      <h2 style={{ fontSize: '2rem', margin: '8px 0', color: 'var(--text-main)' }}>{selectedProduct.designName}</h2>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Category: {selectedProduct.category}</span>
                  </div>

                  <div className="responsive-grid" style={{ gap: '20px', marginBottom: '25px' }}>
                      <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '15px', textTransform: 'uppercase' }}>Crafting History</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Worker</span><span style={{ fontWeight: 600 }}>{selectedProduct.workerId?.name}</span></div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Assigned</span><span>{new Date(selectedProduct.createdAt).toLocaleDateString()}</span></div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Finished</span><span style={{ color: 'var(--success)', fontWeight: 600 }}>{new Date(selectedProduct.updatedAt).toLocaleDateString()}</span></div>
                          </div>
                      </div>
                      <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '15px', textTransform: 'uppercase' }}>Gold Statistics</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Net Weight</span><span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedProduct.netWeight}g</span></div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Gross Weight</span><span>{selectedProduct.grossWeight}g</span></div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Actual Wastage</span><span style={{ color: 'var(--danger)', fontWeight: 600 }}>{selectedProduct.actualWastage}g</span></div>
                          </div>
                      </div>
                  </div>

                  <div style={{ borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden', marginBottom: '30px' }}>
                      <div style={{ background: 'var(--dark-bg)', padding: '15px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 0 }}>Stone Manifest</p>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-gold)' }}>TOTAL: {calculateTotalStoneWeight(selectedProduct.stones).toFixed(2)} ct/g</span>
                      </div>
                      {selectedProduct.stones && selectedProduct.stones.length > 0 ? (
                          <div style={{ padding: '10px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    {selectedProduct.stones.map((st, idx) => (
                                        <tr key={idx} style={{ borderBottom: idx === selectedProduct.stones.length - 1 ? 'none' : '1px solid var(--glass-border)' }}>
                                            <td style={{ padding: '12px', fontWeight: 600 }}>{st.stoneName}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{st.stoneWeight}</td>
                                            <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{st.stoneDetails || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                          </div>
                      ) : (
                          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No stones recorded for this piece.</div>
                      )}
                  </div>

                  <div style={{ display: 'flex', gap: '15px' }}>
                      <button onClick={() => setSelectedProduct(null)} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-main)' }}>Close</button>
                      <button onClick={() => handlePrint(selectedProduct)} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', borderRadius: '10px' }}><Printer size={18}/> Print QR label</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- EDIT MODAL --- */}
      {editingProduct && (
          <div className="modal-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div className="glass" style={{ width: '90%', maxWidth: '500px', padding: '30px', background: 'var(--surface-bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Edit Inventory Record</h3>
                      <X onClick={() => setEditingProduct(null)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }}/>
                  </div>
                  <form onSubmit={handleEditSubmit}>
                      <div className="input-group">
                          <label>Design Name</label>
                          <input 
                            value={editFormData.designName} 
                            onChange={e => setEditFormData({...editFormData, designName: e.target.value})} 
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--dark-bg)', color: 'var(--text-main)' }}
                          />
                      </div>
                      <div className="input-group">
                          <label>Net Weight (g)</label>
                          <input 
                            type="number" step="0.01" 
                            value={editFormData.netWeight} 
                            onChange={e => setEditFormData({...editFormData, netWeight: e.target.value})} 
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--dark-bg)', color: 'var(--text-main)' }}
                          />
                      </div>
                      
                      <div style={{ marginBottom: '25px' }}>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Stone Weights</p>
                          <div style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '5px' }}>
                            {editFormData.stones.map((st, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px', background: 'var(--dark-bg)', padding: '12px', borderRadius: '10px' }}>
                                    <div style={{ flex: 2, fontWeight: 600, fontSize: '0.9rem' }}>{st.stoneName}</div>
                                    <input 
                                        type="number" step="0.01" 
                                        value={st.stoneWeight} 
                                        onChange={e => updateEditStone(idx, 'stoneWeight', e.target.value)} 
                                        style={{ flex: 1, border: 'none', background: 'var(--surface-bg)', padding: '5px 10px', borderRadius: '6px', textAlign: 'center' }} 
                                    />
                                </div>
                            ))}
                          </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                          <button type="button" onClick={() => setEditingProduct(null)} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                          <button type="submit" className="btn-primary" style={{ flex: 1, borderRadius: '10px' }}>Update Item</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Inventory;
