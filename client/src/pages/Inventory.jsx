import React, { useState, useEffect } from 'react';
import api from '../api';
import { Package, ShieldCheck, Search, Download, Printer, X, Tag, Edit2, Trash2, Eye } from 'lucide-react';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // View & Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('date');
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
      setProducts(productRes.data.filter(p => p.status === 'completed') || []);
      if (companyRes.data) {
          setCompanySettings(companyRes.data);
      }
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

  // Filter & Search Logic
  let displayProducts = products.filter(p => 
    (p.designName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.productId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.workerId?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showSelectedOnly) {
    displayProducts = displayProducts.filter(p => selectedItems.includes(p._id));
  }

  displayProducts.sort((a, b) => {
    if (sortBy === 'name') return (a.designName || '').localeCompare(b.designName || '');
    if (sortBy === 'weight') return (b.netWeight || 0) - (a.netWeight || 0);
    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(displayProducts.map(p => p._id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const calculateTotalStoneWeight = (stones) => {
      if (!stones || stones.length === 0) return 0;
      return stones.reduce((acc, current) => acc + (parseFloat(current.stoneWeight) || 0), 0);
  };

  if (loading) return <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>Loading inventory...</div>;

  return (
    <div className="glass" style={{ padding: '24px', background: 'var(--surface-bg)' }}>
      <div className="no-print" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
              <h2 className="gold-gradient" style={{ fontSize: '1.8rem', margin: 0 }}>INVENTORY</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '5px' }}>Manage and view your completed inventory items</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
              <button className="glass" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', border: '1px solid var(--success)', padding: '10px 20px', borderRadius: '10px', fontWeight: 600 }}>
                  <Download size={18} /> Export
              </button>
          </div>
      </div>

      <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <Search style={{ position: 'absolute', left: '15px', top: '14px', color: 'var(--primary-gold)' }} size={20}/>
          <input 
              type="text" 
              placeholder="Search by ID, name or worker..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '12px 15px 12px 45px', background: 'transparent', border: '2px solid var(--primary-gold)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}
          />
        </div>
        
        <button 
          onClick={() => setShowSelectedOnly(!showSelectedOnly)}
          style={{ padding: '12px 20px', borderRadius: '8px', border: '2px solid var(--primary-gold)', color: showSelectedOnly ? 'var(--dark-bg)' : 'var(--primary-gold)', background: showSelectedOnly ? 'var(--primary-gold)' : 'transparent', cursor: 'pointer', fontWeight: 600, transition: 'var(--transition)' }}
        >
          {showSelectedOnly ? 'Show All' : 'Show selected |'}
        </button>

        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: '12px 20px', borderRadius: '8px', border: '2px solid var(--primary-gold)', background: 'transparent', color: 'var(--primary-gold)', cursor: 'pointer', fontWeight: 600, outline: 'none' }}
        >
          <option value="date" style={{background: 'var(--dark-bg)'}}>Sorted by Date</option>
          <option value="name" style={{background: 'var(--dark-bg)'}}>Sorted by Name</option>
          <option value="weight" style={{background: 'var(--dark-bg)'}}>Sorted by Weight</option>
        </select>
      </div>

      <div className="glass no-print" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                  <tr style={{ textAlign: 'left', background: 'var(--dark-bg)', borderBottom: '2px solid var(--primary-gold)', color: 'var(--primary-gold)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '15px 10px', textAlign: 'center', width: '50px' }}>
                          <input 
                            type="checkbox" 
                            checked={displayProducts.length > 0 && selectedItems.length === displayProducts.length}
                            onChange={handleSelectAll}
                            style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--primary-gold)' }}
                            title="select all"
                          />
                      </th>
                      <th style={{ padding: '15px 10px', fontWeight: 600 }}>S.no</th>
                      <th style={{ padding: '15px', fontWeight: 600 }}>Product Code</th>
                      <th style={{ padding: '15px', fontWeight: 600 }}>Product name</th>
                      <th style={{ padding: '15px', fontWeight: 600 }}>Net Wt</th>
                      <th style={{ padding: '15px', fontWeight: 600 }}>Gross Wt</th>
                      <th style={{ padding: '15px', fontWeight: 600 }}>Stone Wt</th>
                      <th style={{ padding: '15px', fontWeight: 600 }}>Worker</th>
                      <th style={{ padding: '15px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
                  </tr>
              </thead>
              <tbody>
                  {displayProducts.map((product, index) => (
                      <tr key={product._id} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem', transition: 'var(--transition)', background: selectedItems.includes(product._id) ? 'rgba(212, 175, 55, 0.05)' : 'transparent' }}>
                          <td style={{ padding: '15px 10px', textAlign: 'center' }}>
                              <input 
                                type="checkbox" 
                                checked={selectedItems.includes(product._id)}
                                onChange={() => handleSelectItem(product._id)}
                                style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--primary-gold)' }}
                              />
                          </td>
                          <td style={{ padding: '15px 10px' }}>{index + 1}</td>
                          <td style={{ padding: '15px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{product.productId}</td>
                          <td style={{ padding: '15px', fontWeight: 600, color: 'var(--text-main)' }}>{product.designName}</td>
                          <td style={{ padding: '15px' }}>{product.netWeight}g</td>
                          <td style={{ padding: '15px' }}>{product.grossWeight}g</td>
                          <td style={{ padding: '15px' }}>{calculateTotalStoneWeight(product.stones).toFixed(2)}</td>
                          <td style={{ padding: '15px' }}>{product.workerId?.name || 'Unassigned'}</td>
                          <td style={{ padding: '15px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <button onClick={() => setSelectedProduct(product)} className="glass" style={{ padding: '6px', color: 'var(--secondary-gold)' }} title="View details"><Eye size={18}/></button>
                                  <button onClick={() => handleEditClick(product)} className="glass" style={{ padding: '6px', color: 'var(--text-muted)' }} title="Edit"><Edit2 size={18}/></button>
                                  <button onClick={() => handlePrint(product)} className="glass" style={{ padding: '6px', color: 'var(--text-main)' }} title="Print"><Printer size={18}/></button>
                              </div>
                          </td>
                      </tr>
                  ))}
                  {displayProducts.length === 0 && (
                      <tr>
                          <td colSpan="9" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                              <Package size={48} style={{ marginBottom: '15px', opacity: 0.2 }} />
                              <p>No inventory items found.</p>
                          </td>
                      </tr>
                  )}
              </tbody>
          </table>
      </div>

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
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Worker</span><span style={{ fontWeight: 600 }}>{selectedProduct.workerId?.name || 'Unassigned'}</span></div>
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
